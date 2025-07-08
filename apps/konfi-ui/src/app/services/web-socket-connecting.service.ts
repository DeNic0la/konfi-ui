import { inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';
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
} from 'rxjs';
import { environment } from '../../environments/environment';
import { RxStomp } from '@stomp/rx-stomp';
import { CheckTableMessage, TableMessage } from '../zod/TableMessage';
import { z } from 'zod';

const backendUrlFactory = () => {
  const prefix = environment.production ? 'wss' : 'ws';
  return `${prefix}://${environment.getHostnameForWS()}/native`;
};

const webSocketJsFactory = () => {
  return new SockJS(`${environment.backendUrl}/sockJs`);
};

export type ZodTableMessage = z.infer<typeof TableMessage>;

@Injectable({
  providedIn: 'root',
  useFactory: () => {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      return new WebSocketConnectingService();
    }
    return null;
  },
})
export class WebSocketConnectingService {
  private readonly rxStompClient = new RxStomp();
  private readonly client = new Client({
    brokerURL: backendUrlFactory(),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });
  private bindable(callback: any) {
    this.client.onStompError = callback.bind(this, false);
    this.client.onWebSocketClose = callback.bind(this, false);
    this.client.onConnect = callback.bind(this, true);
    callback(this.client.connected, null);
  }
  private readonly onClientConnected$ = bindCallback(
    this.bindable.bind(this)
  )().pipe(
    map((isConnected, data) => {
      return isConnected;
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  constructor() {
    if (typeof WebSocket !== 'function') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      this.client.webSocketFactory = webSocketJsFactory;

      this.rxStompClient.configure({
        webSocketFactory: webSocketJsFactory,
        brokerURL: `${environment.backendUrl}/sockJs`,
      });
    } else {
      this.rxStompClient.configure({
        brokerURL: backendUrlFactory(),
      });
    }
    this.rxStompClient.activate();
    this.client.activate();
  }
  public observeTable(tableName: string) {
    return this.rxStompClient.watch(`/table/${tableName}`).pipe(
      map((data) => {
        const result = CheckTableMessage.safeParse(data.body);
        if (result.success) {
          return result.data;
        } else {
          console.log(data.body);
          console.error('Invalid message format:', result.error);
          return null; // or handle the error as needed
        }
      })
    );
  }

  public joinTable(tableName: string, username: string) {
    this.rxStompClient.publish({
      destination: `/live/join/${tableName}`,
      body: JSON.stringify({
        user: username,
        type: 'JOIN',
      }),
    });
  }
  public updateKonfiVote(tableName: string, username: string, konfi: number) {
    this.rxStompClient.publish({
      destination: `/live/update/${tableName}`,
      body: JSON.stringify({
        user: username,
        type: 'UPDATE',
        konfi: z.number().int().parse(konfi),
      }),
    });
  }
  public observeTopic(topic: string) {
    return this.rxStompClient.watch(topic);

    return this.onClientConnected$.pipe(
      takeWhile((value) => !value, true),
      filter((value) => !!value),
      switchMap(
        () =>
          new Observable((subscriber) => {
            const clientSub = this.client.subscribe(topic, (message) => {
              // TODO: Validate message using zod schema
              console.log(message);
              subscriber.next(message);
            });
            return () => {
              clientSub.unsubscribe();
            };
          })
      ),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public publish(destination: string, body: any) {
    return this.rxStompClient.publish({ destination, body });
    this.client.publish({ destination, body });
  }
}
