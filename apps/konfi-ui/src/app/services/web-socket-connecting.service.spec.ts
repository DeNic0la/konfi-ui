import { TestBed } from '@angular/core/testing';

import { WebSocketConnectingService } from './web-socket-connecting.service';

describe('WebSocketConnectingService', () => {
  let service: WebSocketConnectingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebSocketConnectingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
