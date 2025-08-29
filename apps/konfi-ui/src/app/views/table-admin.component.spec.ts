import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { Subject } from 'rxjs';
import { TableAdminComponent } from './table-admin.component';
import { NameService } from '../services/name.service';
import {
  WebSocketConnectingService,
  ZodTableMessage,
} from '../services/web-socket-connecting.service';
import {
  createMockWebSocketConnectingService,
  createMockClipboard,
} from '../../test-utils/mocks';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:4200',
  },
  writable: true,
});

// Mock PrimeUI theme token function
jest.mock('@primeuix/themes', () => ({
  $dt: jest.fn(() => '#007ad9'), // Return a mock color value
}));

describe('TableAdminComponent', () => {
  let component: TableAdminComponent;
  let fixture: ComponentFixture<TableAdminComponent>;
  let mockWebSocketService: ReturnType<typeof createMockWebSocketConnectingService>['service'];
  let mockClipboard: ReturnType<typeof createMockClipboard>['clipboard'];

  beforeEach(async () => {
    const { service: mockWebSocket } = createMockWebSocketConnectingService();
    const { clipboard } = createMockClipboard();
    mockWebSocketService = mockWebSocket;
    mockClipboard = clipboard;

    await TestBed.configureTestingModule({
      imports: [TableAdminComponent],
      providers: [
        NameService,
        { provide: WebSocketConnectingService, useValue: mockWebSocketService },
        { provide: Clipboard, useValue: mockClipboard },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TableAdminComponent, {
        set: {
          template: '<div>Test Template</div>',
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TableAdminComponent);
    component = fixture.componentInstance;
    TestBed.inject(NameService);

    // Set up default values
    fixture.componentRef.setInput('id', 'test-table-123');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct services', () => {
    expect(component.nameService).toBeTruthy();
    expect(component.id()).toBe('test-table-123');
  });

  describe('joinUrl computed', () => {
    it('should generate correct join URL', () => {
      fixture.componentRef.setInput('id', 'my-test-table');
      fixture.detectChanges();

      const joinUrl = component.joinUrl();

      expect(joinUrl).toBe('http://localhost:4200/table/my-test-table');
    });

    it('should update when id changes', () => {
      fixture.componentRef.setInput('id', 'table-1');
      fixture.detectChanges();
      expect(component.joinUrl()).toBe('http://localhost:4200/table/table-1');

      fixture.componentRef.setInput('id', 'table-2');
      fixture.detectChanges();
      expect(component.joinUrl()).toBe('http://localhost:4200/table/table-2');
    });
  });

  describe('copyLink', () => {
    it('should copy the join URL to clipboard', () => {
      fixture.componentRef.setInput('id', 'copy-test');
      fixture.detectChanges();

      component.copyLink();

      expect(mockClipboard.copy).toHaveBeenCalledWith(
        'http://localhost:4200/table/copy-test'
      );
    });

    it('should trigger onCopied$ subject', (done) => {
      component.showCopyCheck$.subscribe((showCheck) => {
        if (showCheck) {
          expect(showCheck).toBe(true);
          done();
        }
      });

      component.copyLink();
    });
  });

  describe('WebSocket data processing', () => {
    beforeEach(() => {
      const messageSubject = new Subject<ZodTableMessage>();
      mockWebSocketService.observeTable.mockReturnValue(messageSubject);
    });

    it('should observe table when id is provided', () => {
      fixture.componentRef.setInput('id', 'observe-test');
      fixture.detectChanges();

      // Trigger the observable by subscribing to one of the derived observables
      component.avg$.subscribe();

      expect(mockWebSocketService.observeTable).toHaveBeenCalledWith(
        'observe-test'
      );
    });
  });

  describe('chart configuration', () => {
    it('should have correct chart type', () => {
      expect(component.chartOptions.chart.type).toBe('area');
    });

    it('should have correct chart dimensions', () => {
      expect(component.chartOptions.chart.height).toBe(300);
      expect(component.chartOptions.chart.width).toBe(1000);
    });

    it('should have correct title', () => {
      expect(component.chartOptions.title.text).toBe('Vote Distribution');
      expect(component.chartOptions.title.align).toBe('left');
    });

    it('should have zoom disabled', () => {
      expect(component.chartOptions.chart.zoom.enabled).toBe(false);
    });

    it('should have dataLabels disabled', () => {
      expect(component.chartOptions.dataLabels.enabled).toBe(false);
    });

    it('should have smooth curve', () => {
      expect(component.chartOptions.stroke.curve).toBe('smooth');
    });
  });

  describe('responsive configuration', () => {
    it('should have responsive breakpoints defined', () => {
      expect(component.chartOptions.responsive).toBeDefined();
      expect(component.chartOptions.responsive.length).toBe(3);
    });

    it('should have correct breakpoint values', () => {
      const responsive = component.chartOptions.responsive;
      expect(responsive[0].breakpoint).toBe(400);
      expect(responsive[1].breakpoint).toBe(600);
      expect(responsive[2].breakpoint).toBe(1200);
    });

    it('should adjust chart dimensions for different breakpoints', () => {
      const responsive = component.chartOptions.responsive;
      expect(responsive[0].options.chart.height).toBe(300);
      expect(responsive[0].options.chart.width).toBe(400);

      expect(responsive[1].options.chart.width).toBe(600);
      expect(responsive[2].options.chart.width).toBe(1000);
    });
  });

  describe('theme colors', () => {
    it('should have primary and surface colors defined', () => {
      expect(component.primaryColor).toBeDefined();
      expect(component.surfaceColor).toBeDefined();
    });
  });

  describe('showCopyCheck$ observable', () => {
    it('should emit true immediately when copy is triggered, then false after delay', (done) => {
      const emissions: boolean[] = [];

      component.showCopyCheck$.subscribe((value) => {
        emissions.push(value);

        if (emissions.length === 2) {
          expect(emissions).toEqual([true, false]);
          done();
        }
      });

      // Simulate copy action
      component.copyLink();
    });

    it('should throttle rapid copy actions', (done) => {
      let emissionCount = 0;

      component.showCopyCheck$.subscribe(() => {
        emissionCount++;
      });

      // Trigger multiple copies rapidly
      component.copyLink();
      component.copyLink();
      component.copyLink();

      setTimeout(() => {
        // Should only get one emission due to throttling
        expect(emissionCount).toBe(1);
        done();
      }, 100);
    });
  });
});
