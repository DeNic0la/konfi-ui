export class RxStomp {
  constructor() {
    this.configure = jest.fn();
    this.activate = jest.fn();
    this.watch = jest.fn();
    this.publish = jest.fn();
  }
}
