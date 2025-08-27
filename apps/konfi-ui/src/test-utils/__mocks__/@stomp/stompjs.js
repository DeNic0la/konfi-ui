export class Client {
  constructor() {
    this.activate = jest.fn();
    this.onConnect = null;
    this.onStompError = null;
    this.onWebSocketClose = null;
    this.connected = false;
    this.subscribe = jest.fn();
    this.publish = jest.fn();
    this.webSocketFactory = null;
  }
}
