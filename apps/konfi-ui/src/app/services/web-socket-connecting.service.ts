import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import SockJS from 'sockjs-client';
import { isPlatformBrowser } from '@angular/common';
import { Client } from '@stomp/stompjs';
import {
  bindCallback,
  filter,
  map,
  Observable,
  shareReplay,
  switchMap,
  takeWhile,
  BehaviorSubject,
  merge,
  timer,
  retry,
  catchError,
  of, takeUntil, Subject, take, debounceTime, delay
} from 'rxjs';
import { environment } from '../../environments/environment';
import { RxStomp } from '@stomp/rx-stomp';
import { CheckTableMessage, TableMessage } from '../zod/TableMessage';
import { z } from 'zod';
import {HttpClient} from "@angular/common/http";

const nativeWebSocketFactory = (http:HttpClient):Observable<string> => {
  return http.get<{wsProtocol: string|undefined,wsHost:string|undefined}>('express/config').pipe(
    filter((value) => z.object({wsProtocol: z.string().min(1), wsHost: z.string().min(2)}).safeParse(value).success),
    map(({wsProtocol,wsHost}) => `${wsProtocol}://${wsHost}/native`),
    take(1),
  )
}

const webSocketJsFactory = () => {
  const prefix = environment.production ? 'https' : 'http';
  return new SockJS(`${prefix}://${environment.getHostnameForWS()}/sockJs`);
};

export type ZodTableMessage = z.infer<typeof TableMessage>;
const statemap = {
  0: 'connecting',
  1: 'connected',
  2: 'disconnected',
  3: 'disconnected',
} as const;
@Injectable({
  providedIn: 'root',
  useFactory: () => {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {


      return new WebSocketConnectingService(nativeWebSocketFactory(inject(HttpClient)));
    }
    return null;
  },
})
export class WebSocketConnectingService {
  private readonly rxStompClient = new RxStomp();


  // Connection status tracking
  private readonly connectionStatusSubject = new BehaviorSubject<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting');
  public readonly connectionStatus$: Observable<'connecting' | 'connected' | 'disconnected' | 'reconnecting'> = this.rxStompClient.connectionState$.pipe(
    map((state) => statemap[state]),
    shareReplay({ refCount: true, bufferSize: 1 })
  );


  // Operation status tracking
  private readonly operationStatusSubject = new BehaviorSubject<{ type: string; status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({ type: 'none', status: 'idle' });
  /**
   * @deprecated dont use that, i will removeit soon
   */
  public readonly operationStatus$ = merge(
    this.operationStatusSubject.asObservable(),
    this.operationStatusSubject.asObservable().pipe(
      filter(event =>event.status !== 'idle'),
      debounceTime(2000),
      map(() => ({ type: 'none', status: 'idle' as const })),
      delay(1000)
    )
  ).pipe(
    shareReplay({ refCount: true, bufferSize: 1 })
  )



  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(nativeUrl: Observable<string>) {
    if (typeof WebSocket !== 'function') {
      this.setupSockJs();
    }
    else {
      nativeUrl.subscribe(value =>{
        this.setupNative(value)
      })
    }
  }
  private setupNative(url: string) {
    this.rxStompClient.configure({
      brokerURL: url,
      reconnectDelay: 5000,
    });
    this.rxStompClient.activate();
  }
  private setupSockJs() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.client.webSocketFactory = webSocketJsFactory;

    this.rxStompClient.configure({
      webSocketFactory: webSocketJsFactory,
      brokerURL: `${environment.getHostnameForWS()}/sockJs`,
      reconnectDelay: 5000,
    });
    this.rxStompClient.activate();

  }

  private  _observingTable = {
    tableName: '',
    observable: null,
    unsub: new Subject()
  } as {tableName:string, observable: Observable<ZodTableMessage|null>|null, unsub: Subject<void>};
  public observeTable(tableName: string):Observable<ZodTableMessage|null> {
    if (this._observingTable.tableName === tableName && this._observingTable.observable !== null){
      return this._observingTable.observable;
    }
    else if (this._observingTable.observable !== null){
      this._observingTable.unsub.next()
    }
    const o = this.rxStompClient.watch(`/table/${tableName}`).pipe(
      takeUntil(this._observingTable.unsub),
      retry({ count: 3, delay: 2000 }),
      map((data) => {
        const result = CheckTableMessage.safeParse(data.body);
        if (result.success) {
          return result.data;
        } else {
          console.log(data.body);
          console.error('Invalid message format:', result.error);
          return null; // or handle the error as needed
        }
      }),
      catchError(error => {
        console.error('WebSocket observation error:', error);
        this.operationStatusSubject.next({ type: 'observe', status: 'error', message: 'Failed to observe table updates' });
        return of(null);
      }),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
    this._observingTable.tableName = tableName;
    this._observingTable.observable = o;
    return  o;
  }

  public joinTable(tableName: string, username: string) {
    this.operationStatusSubject.next({ type: 'join', status: 'loading', message: 'Joining table...' });
    const joinedSuccessfully$ = this.observeTable(tableName).pipe(
      filter((v) => v!== null && v.user === username),
      take(1),
      map(value => value?.type === 'JOIN')
    )
    try {
      this.rxStompClient.publish({
        destination: `/live/join/${tableName}`,
        body: JSON.stringify({
          user: username,
          type: 'JOIN',
        }),
      });

      // Simulate success after a delay (in real app, this would be confirmed by server response)
      joinedSuccessfully$.subscribe((success) => {
        if (success) {
          this.operationStatusSubject.next({ type: 'join', status: 'success', message: 'Successfully joined table' });
        }
      });

    } catch (error) {
      this.operationStatusSubject.next({ type: 'join', status: 'error', message: 'Failed to join table' });
      console.error(error);
      //throw error;
    }
  }
  public updateKonfiVote$(tableName: string, username: string, konfi: number):Observable<{status: 'loading' | 'success' | 'error' | 'unknown'}> {
    return new Observable(subscriber => {
      const success$ = this.observeTable(tableName).pipe(
        filter((v) => v!== null && v.user === username && v.type === 'UPDATE'),
        take(1),
        map(value => value?.konfi)
      )
      subscriber.add(success$.subscribe(value =>{
        subscriber.next({status: value? 'success' : 'unknown'})
        subscriber.complete();
      }));
      try {
        this.rxStompClient.publish({
          destination: `/live/update/${tableName}`,
          body: JSON.stringify({
            user: username,
            type: 'UPDATE',
            konfi: z.number().int().parse(konfi),
          }),
        });
        subscriber.next({status: 'loading'})
      }
      catch (e) {
        subscriber.next({status: 'error'});
        console.error(e);
        subscriber.complete();
      }
    })
  }
  public updateKonfiVote(tableName: string, username: string, konfi: number) {
    try {
      this.rxStompClient.publish({
        destination: `/live/update/${tableName}`,
        body: JSON.stringify({
          user: username,
          type: 'UPDATE',
          konfi: z.number().int().parse(konfi),
        }),
      });

    } catch (error) {
      this.operationStatusSubject.next({ type: 'vote', status: 'error', message: 'Failed to update vote' });
      console.error(error);
      //throw error;
    }
  }
  public observeTopic(topic: string) {
    return this.rxStompClient.watch(topic);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public publish(destination: string, body: any) {
    return this.rxStompClient.publish({ destination, body });
  }
}
