import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of, Subject } from 'rxjs';
import {
  WebSocketConnectingService,
  ZodTableMessage,
} from './web-socket-connecting.service';

// Mock RxStomp
jest.mock('@stomp/rx-stomp', () => ({
  RxStomp: jest.fn().mockImplementation(() => ({
    configure: jest.fn(),
    activate: jest.fn(),
    watch: jest.fn(),
    publish: jest.fn(),
  })),
}));

// Mock STOMP Client
jest.mock('@stomp/stompjs', () => ({
  Client: jest.fn().mockImplementation(() => ({
    activate: jest.fn(),
    onConnect: null,
    onStompError: null,
    onWebSocketClose: null,
    connected: false,
    subscribe: jest.fn(),
    publish: jest.fn(),
    webSocketFactory: null,
  })),
}));

// Mock SockJS
jest.mock('sockjs-client', () => jest.fn());

describe('WebSocketConnectingService', () => {
  let service: WebSocketConnectingService | null;
  let mockRxStomp: {
    configure: jest.Mock;
    activate: jest.Mock;
    watch: jest.Mock;
    publish: jest.Mock;
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock RxStomp instance
    mockRxStomp = {
      configure: jest.fn(),
      activate: jest.fn(),
      watch: jest.fn().mockReturnValue(of()),
      publish: jest.fn(),
    };

    const { RxStomp } = require('@stomp/rx-stomp');
    RxStomp.mockImplementation(() => mockRxStomp);
  });

  describe('in browser environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(WebSocketConnectingService);
    });

    it('should be created in browser', () => {
      expect(service).toBeTruthy();
    });

    it('should configure RxStomp on creation', () => {
      expect(mockRxStomp.configure).toHaveBeenCalled();
      expect(mockRxStomp.activate).toHaveBeenCalled();
    });

    it('should observe table correctly', (done) => {
      const mockTableMessage: ZodTableMessage = {
        type: 'JOIN',
        konfi: 3,
        user: 'testUser',
      };

      const messageSubject = new Subject<{ body: string }>();
      mockRxStomp.watch.mockReturnValue(messageSubject);

      service?.observeTable('testTable').subscribe((result) => {
        expect(result).toEqual(mockTableMessage);
        done();
      });

      // Simulate receiving a valid message
      messageSubject.next({ body: JSON.stringify(mockTableMessage) });
    });

    it('should handle invalid message format gracefully', (done) => {
      const messageSubject = new Subject<{ body: string }>();
      mockRxStomp.watch.mockReturnValue(messageSubject);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      service?.observeTable('testTable').subscribe((result) => {
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Invalid message format:',
          expect.any(Object)
        );
        expect(consoleLogSpy).toHaveBeenCalledWith('invalid message');

        consoleSpy.mockRestore();
        consoleLogSpy.mockRestore();
        done();
      });

      // Simulate receiving an invalid message
      messageSubject.next({ body: 'invalid message' });
    });

    it('should join table correctly', () => {
      service?.joinTable('testTable', 'testUser');

      expect(mockRxStomp.publish).toHaveBeenCalledWith({
        destination: '/live/join/testTable',
        body: JSON.stringify({
          user: 'testUser',
          type: 'JOIN',
        }),
      });
    });

    it('should update konfi vote correctly', () => {
      service?.updateKonfiVote('testTable', 'testUser', 4);

      expect(mockRxStomp.publish).toHaveBeenCalledWith({
        destination: '/live/update/testTable',
        body: JSON.stringify({
          user: 'testUser',
          type: 'UPDATE',
          konfi: 4,
        }),
      });
    });

    it('should validate konfi vote is integer', () => {
      expect(() => {
        service?.updateKonfiVote('testTable', 'testUser', 4.5);
      }).toThrow();
    });

    it('should observe topic correctly', () => {
      const mockTopic = '/test/topic';
      service?.observeTopic(mockTopic);

      expect(mockRxStomp.watch).toHaveBeenCalledWith(mockTopic);
    });

    it('should publish messages correctly', () => {
      const destination = '/test/destination';
      const body = 'test message';

      service?.publish(destination, body);

      expect(mockRxStomp.publish).toHaveBeenCalledWith({
        destination,
        body,
      });
    });
  });

  describe('in server environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(WebSocketConnectingService);
    });

    it('should return null in server environment', () => {
      expect(service).toBeNull();
    });
  });
});
