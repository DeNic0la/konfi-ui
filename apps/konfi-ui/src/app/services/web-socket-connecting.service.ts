import { inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';
import * as SockJS from 'sockjs-client';
import { environment } from '@Environments/environment';
import { isPlatformBrowser } from '@angular/common';
import {Client, StompHeaders} from '@stomp/stompjs';
import {bindCallback, filter, map, Observable, pipe, shareReplay, switchMap, take, takeUntil, takeWhile} from 'rxjs';

const backendUrlFactory = () => {
  const prefix = environment.production ? 'wss' : 'ws';
  return `${prefix}://${window.location.hostname}/native`;
};

const webSocketJsFactory = () => {
  return new SockJS(`${environment.backendUrl}/sockJs`);
};

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
  private readonly client = new Client({
    brokerURL: backendUrlFactory(),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });
  private bindable(callback) {
    this.client.onStompError = callback.bind(this, false);
    this.client.onWebSocketClose = callback.bind(this, false);
    this.client.onConnect = callback.bind(this, true);
    callback(this.client.connected, null);
  }
  private readonly onClientConnected$ = bindCallback(this.bindable.bind(this)).pipe(
    map((isConnected, data) => {
      console.log(data);
      return isConnected;
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  constructor() {
    if (typeof WebSocket !== 'function') {
      this.client.webSocketFactory = webSocketJsFactory;
    }
  }
  public observeTopic(topic: string) {
    this.onClientConnected$.pipe(
      takeWhile( (value) => (!value),true),
        filter((value)=>value),
        switchMap(()=>new Observable(subscriber => {
          const clientSub = this.client.subscribe(topic,(message)=>{
            // TODO: Validate message using zod schema
            subscriber.next(message)
          })
        })
      ),
      )
  }
}
