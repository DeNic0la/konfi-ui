import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  PLATFORM_ID,
  ViewEncapsulation,
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
} from 'rxjs';
import { Chip } from 'primeng/chip';
import { Card } from 'primeng/card';
import { QrCodeComponent } from 'ng-qrcode';
import { $dt } from '@primeuix/themes';
import { Button } from 'primeng/button';
import { Clipboard } from '@angular/cdk/clipboard';
import { z } from 'zod';
import { ChartComponent, ChartType } from 'ng-apexcharts';

@Component({
  selector: 'app-table-admin',
  imports: [CommonModule, Chip, Card, QrCodeComponent, Button, ChartComponent],

  templateUrl: './table-admin.component.html',
  styles: `
    :host {
      display: block;
    }
    .avg {
      font-size: 5rem;
      text-align: center;
      color: var(--primary-color);
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableAdminComponent {
  public primaryColor = $dt('primary.color');
  public surfaceColor = $dt('surface.color');
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
  private readonly plattform = inject(PLATFORM_ID);
  id = input<string>();
  joinUrl = computed(() => `${window.location.origin}/table/${this.id()}`);
  public copyLink() {
    this.clipboad.copy(this.joinUrl());
    this.onCopied$.next();
  }
  private readonly a$: Observable<ZodTableMessage> = toObservable(this.id).pipe(
    filter(
      (value): value is string =>
        value !== undefined && value !== null && value.length > 0
    ),
    switchMap((tableId) => this.webSocketService.observeTable(tableId)),
    filter((v): v is ZodTableMessage => v !== undefined && v !== null),
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
      return Object.keys(data);
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

  public chartOptions = {
    responsive: [
      {
        breakpoint: 400,
        options: {
          chart: {
            height: 300,
            width: 400,
          },
        },
      },
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 300,
            width: 600,
          },
        },
      },
      {
        breakpoint: 1200,
        options: {
          chart: {
            height: 300,
            width: 1000,
          },
        },
      },
    ],
    chart: {
      type: 'area' as ChartType,
      height: 300,
      width: 1000,
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
    },

    title: {
      text: 'Vote Distribution',
      align: 'left' as const,
    },

    xaxis: {
      type: 'numeric' as const,
    },
    yaxis: {
      opposite: true,
    },
    legend: {
      horizontalAlign: 'left',
    },
  };
}
