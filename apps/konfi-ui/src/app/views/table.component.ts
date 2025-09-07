import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  ViewEncapsulation,
  AfterViewInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NameService } from '../services/name.service';
import { KonfiSelectionComponent } from '../components/konfi-selection.component';
import { NameInputComponent } from '../components/name-input.component';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Card } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';
import { Message } from 'primeng/message';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { WebSocketConnectingService } from '../services/web-socket-connecting.service';
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { StyleClass } from 'primeng/styleclass';

@Component({
  selector: 'app-table',
  imports: [
    CommonModule,
    KonfiSelectionComponent,
    NameInputComponent,
    ProgressSpinner,
    Card,
    Skeleton,
    Message,
    Toast,
    StyleClass,
  ],
  providers: [MessageService],
  template: `
    <div class="h-screen w-full" role="main" aria-labelledby="page-title">
      <h1 id="page-title" class="sr-only">Table Voting Interface</h1>

      <p-toast
        position="top-center"
        [breakpoints]="{ '920px': { width: '100%', right: '0', left: '0' } }"
        role="alert"
        aria-live="polite"
      >
      </p-toast>
      <p-toast
        key="sr-only"
        pStyleClass="sr-only"
        class="sr-only"
        role="alert"
        aria-live="polite"
      >
      </p-toast>
      <!-- Screen Reader Skip Navigation -->
      <a href="#main-content" class="sr-only">Skip to main content</a>

      @defer (on idle) { @if ((connectionError$ | async) === true ) {
      <!-- Connection Error State -->
      <p-card
        class="h-full w-full flex align-items-center justify-content-center"
        role="alert"
        aria-labelledby="connection-error-title"
      >
        <div class="text-center">
          <h2 id="connection-error-title" class="sr-only">Connection Error</h2>
          <p-message
            severity="error"
            text="Verbindung zum Server fehlgeschlagen. Bitte versuche es erneut."
            [closable]="false"
            role="alert"
            aria-describedby="reconnect-status"
          >
          </p-message>
          <div
            id="reconnect-status"
            class="mt-3 flex gap-2 justify-content-center"
            role="status"
            aria-live="polite"
          >
            <p-progressSpinner
              class="w-2rem h-2rem"
              strokeWidth="6"
              fill="transparent"
              aria-label="Reconnecting to server"
            >
            </p-progressSpinner>
            <span>Verbinde wieder...</span>
          </div>
        </div>
      </p-card>
      } @else if (tableNotFound()) {
      <!-- Table Not Found State -->
      <p-card
        class="h-full w-full flex align-items-center justify-content-center"
        role="alert"
        aria-labelledby="not-found-title"
      >
        <div class="text-center">
          <h2 id="not-found-title" class="sr-only">Table Not Found</h2>
          <p-message
            severity="warn"
            content="Tisch nicht gefunden. Überprüfe die URL oder erstelle einen neuen Tisch."
            [closable]="false"
            role="alert"
          >
          </p-message>
        </div>
      </p-card>
      } @else {
      <!-- Main Content -->
      <div id="main-content" role="region" aria-label="Table Content">
        @if (hasJoinedTable()){
        <app-konfi-selection
          [id]="id()"
          [username]="username$.value"
          role="region"
          aria-label="Vote on this table's brunch rating"
        >
        </app-konfi-selection>
        } @else {
        <app-name-input
          role="region"
          (declareUsername)="username$.next($event)"
          aria-label="Enter your name to join the table"
        >
        </app-name-input>
        }
      </div>
      } } @placeholder (minimum 10ms){
      <p-card
        class="h-full w-full flex align-items-center justify-content-center"
        role="status"
        aria-live="polite"
        aria-labelledby="loading-title"
      >
        <div class="text-center">
          <p-progressSpinner
            class="w-4rem h-4rem"
            strokeWidth="4"
            fill="transparent"
            role="status"
            aria-label="Loading table content"
          >
          </p-progressSpinner>
          <div class="mt-3">
            <h2 id="loading-title" class="sr-only">Loading Table</h2>
            <p-skeleton
              width="200px"
              height="1.5rem"
              class="mb-2"
              aria-label="Loading table name"
            ></p-skeleton>
            <p-skeleton
              width="150px"
              height="1rem"
              aria-label="Loading table details"
            ></p-skeleton>
          </div>
        </div>
      </p-card>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements AfterViewInit {
  public readonly nameService = inject(NameService);
  private readonly webSocketService = inject(WebSocketConnectingService);
  private readonly messageService = inject(MessageService);
  private readonly plattform = inject(PLATFORM_ID);
  public username$ = new BehaviorSubject<string>('');

  id = input<string>();

  public joinedTable$ = this.username$.pipe(
    takeUntilDestroyed(),
    filter((name) => name.trim().length > 0),
    switchMap((name) =>
      this.webSocketService.joinTable$(<string>this.id(), name)
    ),
    map((value) => value.status === 'success')
  );
  hasJoinedTable = toSignal(this.joinedTable$, { initialValue: false });

  // Loading and error states
  tableNotFound = signal(false);

  // Connection status observable
  public readonly connectionError$ =
    this.webSocketService.connectionStatus$.pipe(
      takeUntilDestroyed(),
      map((value) => value !== 'connected'),
      distinctUntilChanged()
    );

  ngAfterViewInit() {
    if (isPlatformBrowser(this.plattform)) {
      // Browser-specific initialization
    }
  }

  private showConnectionToast(
    message: string,
    severity: 'success' | 'error' | 'info'
  ) {
    this.messageService.add({
      severity,
      summary: 'Verbindungsstatus',
      detail: message,
      life: 3000,
    });
  }
}
