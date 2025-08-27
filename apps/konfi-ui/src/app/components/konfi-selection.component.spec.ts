import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { KonfiSelectionComponent } from './konfi-selection.component';
import { NameService } from '../services/name.service';
import { WebSocketConnectingService } from '../services/web-socket-connecting.service';
import { createMockWebSocketConnectingService } from '../../test-utils/mocks';

describe('KonfiSelectionComponent', () => {
  let component: KonfiSelectionComponent;
  let fixture: ComponentFixture<KonfiSelectionComponent>;
  let mockWebSocketService: any;
  let nameService: NameService;

  beforeEach(async () => {
    const { service: mockWebSocket, mocks } =
      createMockWebSocketConnectingService();
    mockWebSocketService = mockWebSocket;

    await TestBed.configureTestingModule({
      imports: [KonfiSelectionComponent],
      providers: [
        NameService,
        { provide: WebSocketConnectingService, useValue: mockWebSocketService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(KonfiSelectionComponent);
    component = fixture.componentInstance;
    nameService = TestBed.inject(NameService);

    // Set up default values
    nameService.username = 'testUser';
    fixture.componentRef.setInput('id', 'test-table-123');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.value).toBe(0);
    expect(component.nameService).toBeTruthy();
    expect(component.id()).toBe('test-table-123');
  });

  it('should call updateKonfiVote when select is called', () => {
    const vote = 4;

    component.select(vote);

    expect(mockWebSocketService.updateKonfiVote).toHaveBeenCalledWith(
      'test-table-123',
      'testUser',
      vote
    );
  });

  it('should handle different vote values', () => {
    const testVotes = [1, 2, 3, 4, 5];

    testVotes.forEach((vote) => {
      component.select(vote);
      expect(mockWebSocketService.updateKonfiVote).toHaveBeenCalledWith(
        'test-table-123',
        'testUser',
        vote
      );
    });

    // Expected calls: 5 from loop + 1 from ngAfterViewInit (initial 0 call) = 6 total
    expect(mockWebSocketService.updateKonfiVote).toHaveBeenCalledTimes(
      testVotes.length + 1
    );
  });

  it('should use the current username from nameService', () => {
    nameService.username = 'differentUser';

    component.select(3);

    expect(mockWebSocketService.updateKonfiVote).toHaveBeenCalledWith(
      'test-table-123',
      'differentUser',
      3
    );
  });

  it('should use the current table id', () => {
    fixture.componentRef.setInput('id', 'different-table');
    fixture.detectChanges();

    component.select(2);

    expect(mockWebSocketService.updateKonfiVote).toHaveBeenCalledWith(
      'different-table',
      'testUser',
      2
    );
  });

  describe('ngAfterViewInit', () => {
    beforeEach(() => {
      // Mock observeTable to return a test observable
      mockWebSocketService.observeTable.mockReturnValue(
        of({
          type: 'JOIN',
          user: 'testUser',
          konfi: 3,
        })
      );
    });

    it('should observe table in browser environment', () => {
      component.ngAfterViewInit();

      expect(mockWebSocketService.observeTable).toHaveBeenCalledWith(
        'test-table-123'
      );
    });

    it('should call updateKonfiVote with initial value 0 in browser', () => {
      component.ngAfterViewInit();

      expect(mockWebSocketService.updateKonfiVote).toHaveBeenCalledWith(
        'test-table-123',
        'testUser',
        0
      );
    });

    it('should log platform ID', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      component.ngAfterViewInit();

      expect(consoleSpy).toHaveBeenCalledWith('browser');

      consoleSpy.mockRestore();
    });
  });

  describe('server environment', () => {
    it('should not call WebSocket methods in server environment', async () => {
      // Reset TestBed for server environment
      TestBed.resetTestingModule();

      const { service: serverMockWebSocket } =
        createMockWebSocketConnectingService();

      await TestBed.configureTestingModule({
        imports: [KonfiSelectionComponent],
        providers: [
          NameService,
          {
            provide: WebSocketConnectingService,
            useValue: serverMockWebSocket,
          },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();

      const serverFixture = TestBed.createComponent(KonfiSelectionComponent);
      const serverComponent = serverFixture.componentInstance;
      const serverNameService = TestBed.inject(NameService);

      serverNameService.username = 'testUser';
      serverFixture.componentRef.setInput('id', 'test-table-123');

      serverFixture.detectChanges();

      serverComponent.ngAfterViewInit();

      // In server environment, the WebSocket methods should not be called
      expect(serverMockWebSocket.observeTable).not.toHaveBeenCalled();
      expect(serverMockWebSocket.updateKonfiVote).not.toHaveBeenCalled();
    });
  });

  describe('constructor behavior', () => {
    it('should join table after next render', () => {
      // This tests the afterNextRender callback
      expect(mockWebSocketService.joinTable).toHaveBeenCalledWith(
        'test-table-123',
        'testUser'
      );
    });
  });
});
