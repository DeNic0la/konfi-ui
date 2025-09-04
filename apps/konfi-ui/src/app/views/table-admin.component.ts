import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  PLATFORM_ID,
  ViewEncapsulation,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NameService } from '../services/name.service';
import {
  WebSocketConnectingService,
  ZodTableMessage,
} from '../services/web-socket-connecting.service';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  delay,
  filter,
  map,
  merge,
  Observable,
  scan,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  throttleTime,
  timer,
  catchError,
  of,
  tap,
} from 'rxjs';
import { Chip } from 'primeng/chip';
import { Card } from 'primeng/card';
import { QrCodeComponent } from 'ng-qrcode';
import { $dt } from '@primeuix/themes';
import { Button } from 'primeng/button';
import { Clipboard } from '@angular/cdk/clipboard';
import { z } from 'zod';
import { ChartComponent, ChartType } from 'ng-apexcharts';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Skeleton } from 'primeng/skeleton';
import { Toast } from 'primeng/toast';
import {MessageService, PrimeTemplate} from 'primeng/api';
import { Badge } from 'primeng/badge';
import { Panel } from 'primeng/panel';
import { Divider } from 'primeng/divider';
import { ProgressBar } from 'primeng/progressbar';

@Component({
  selector: 'app-table-admin',
  imports: [
    CommonModule,
    Chip,
    Card,
    QrCodeComponent,
    Button,
    ChartComponent,
    ProgressSpinner,
    Skeleton,
    Toast,
    Badge,
    Panel,
    Divider,
    ProgressBar,
    PrimeTemplate
  ],
  providers: [MessageService],
  templateUrl: './table-admin.component.html',
  styles: `
    :host {
      display: block;
    }
    .avg {
      font-size: 5rem;
      text-align: center;
      color: var(--p-primary-400);
    }

    .skeleton-card {
      padding: 1rem;
    }


    .fade-in {
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #main-content{
      margin-right: 0;
      margin-left: 0;
      margin-top: 0;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableAdminComponent implements OnInit {
  public primaryColor = $dt('primary.color') as {name: string, variable: string, value: `#${string}`};
  public surfaceColor = $dt('surface.color') as {name: string, variable: string, value: `#${string}`};
  private readonly onCopied$ = new Subject<void>();
  private readonly onCopiedFiltered$ = this.onCopied$.pipe(
    throttleTime(1000),
    map(() => true),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  public readonly showCopyCheck$ = merge(
    this.onCopiedFiltered$,
    this.onCopiedFiltered$.pipe(
      delay(800),
      map(() => false)
    )
  );
  private readonly clipboad = inject(Clipboard);
  public readonly nameService = inject(NameService);
  private readonly webSocketService = inject(WebSocketConnectingService);
  private readonly messageService = inject(MessageService);
  private readonly plattform = inject(PLATFORM_ID);

  id = input<string>();
  joinUrl = computed(() => `${window.location.origin}/table/${this.id()}`);

  // Loading and status signals
  isInitialLoading = signal(true);
  isQrLoading = signal(true);
  isChartLoading = signal(true);
  connectionStatus = signal<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting');
  participantCount = signal(0);

  ngOnInit() {
    // Simulate initial loading phases
    timer(1000).subscribe(() => {
      this.isQrLoading.set(false);
    });

    timer(1500).subscribe(() => {
      this.isInitialLoading.set(false);
    });

    timer(2000).subscribe(() => {
      this.isChartLoading.set(false);
    });

    // Subscribe to connection status
    this.webSocketService.connectionStatus$.subscribe(status => {
      this.connectionStatus.set(status);

      switch(status) {
        case 'connected':
          this.showToast('success', 'Verbunden', 'Live-Updates aktiviert');
          break;
        case 'disconnected':
          this.showToast('error', 'Verbindung verloren', 'Versuche wiederherzustellen...');
          break;
        case 'reconnecting':
          this.showToast('info', 'Verbinde neu', 'Stelle Verbindung wieder her...');
          break;
      }
    });
  }

  public copyLink() {
    try {
      this.clipboad.copy(this.joinUrl());
      this.onCopied$.next();
      this.showToast('success', 'Link kopiert', 'Der Einladungslink wurde in die Zwischenablage kopiert');
    } catch (error) {
      this.showToast('error', 'Fehler', 'Link konnte nicht kopiert werden');
    }
  }

  private showToast(severity: 'success' | 'error' | 'info' | 'warn', summary: string, detail: string) {
    this.messageService.add({
      severity,
      summary,
      detail,
      life: 3000
    });
  }
  private readonly a$: Observable<ZodTableMessage> = toObservable(this.id).pipe(
    filter(
      (value): value is string =>
        value !== undefined && value !== null && value.length > 0
    ),
    switchMap((tableId) => this.webSocketService.observeTable(tableId)),
    filter((v): v is ZodTableMessage => v !== undefined && v !== null),
    tap((message) => {
      // Show real-time activity notifications
      if (message.type === 'UPDATE' && message.user) {
        this.showToast('info', 'Vote Update', `${message.user} hat sein Vote aktualisiert`);
      }
    }),
    catchError(error => {
      console.error('Error observing table:', error);
      this.showToast('error', 'Fehler', 'Problem beim Laden der Live-Daten');
      return of(null as any);
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  private readonly map$ = this.a$.pipe(
    scan((acc, value) => {
      if (
        typeof value?.user === 'string' &&
        (value?.type === 'JOIN' || value?.type === 'UPDATE')
      ) {
        acc = { ...acc, [value.user]: value.konfi };
      } else if (value?.type === 'LEAVE' && typeof value?.user === 'string') {
        delete acc[value.user];
      }
      return acc;
    }, {} as Record<string, number | null>),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  public readonly avg$ = this.map$.pipe(
    map((data) => {
      const all = Object.values(data).filter(
        (value): value is number =>
          z.number().min(0).max(5).safeParse(value).success
      );
      return (
        all.reduce(
          (previousValue, currentValue) => previousValue + currentValue,
          0
        ) / all.length
      );
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  public readonly users$ = this.map$.pipe(
    map((data) => {
      const users = Object.keys(data);
      this.participantCount.set(users.length);
      return users;
    }),
    tap(users => {
      // Show notifications for participant changes
      if (users.length > this.participantCount()) {
        this.showToast('info', 'Neuer Teilnehmer', 'Jemand ist dem Tisch beigetreten');
      }
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  public series$ = this.map$.pipe(
    map((v) => {
      const votes = [0, 0, 0, 0, 0];
      for (const vote of Object.values(v)) {
        if (typeof vote !== 'number') continue;
        votes[vote - 1]++;
      }
      return votes;
    }),
    startWith([0, 0, 0, 0, 0]),
    map((data) => {
      return [
        {
          name: 'Votes',
          data,
        },
      ];
    })
  );

  public hasChartData$ = this.series$.pipe(
    map(series => series[0]?.data?.some(value => value > 0) ?? false),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  public chartOptions = {
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 200,
          },
          title: {
            style: {
              fontSize: '14px',
            },
          },
        },
      },
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 250,
          },
          title: {
            style: {
              fontSize: '16px',
            },
          },
        },
      },
      {
        breakpoint: 1200,
        options: {
          chart: {
            height: 300,
          },
        },
      },
    ],
    chart: {
      type: 'bar' as ChartType,
      height: 300,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
      },
    },
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 4,
      },
    },
    colors: ['#3B82F6'],
    title: {
      text: '',
      align: 'left' as const,
      style: {
        fontSize: '16px',
        fontWeight: '600',
      },
    },
    xaxis: {
      categories: ['1⭐', '2⭐', '3⭐', '4⭐', '5⭐'],
      title: {
        text: 'Bewertung',
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Anzahl Votes',
        style: {
          fontSize: '12px',
        },
      },
    },
    legend: {
      show: false,
    },
    grid: {
      show: true,
      strokeDashArray: 3,
    },
  };
}
