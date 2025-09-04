import {
  afterNextRender,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  PLATFORM_ID,
  ViewEncapsulation,
  signal,
  computed,
} from '@angular/core';
import {
  CommonModule,
  isPlatformBrowser,
  NgOptimizedImage,
} from '@angular/common';
import { NameService } from '../services/name.service';
import { WebSocketConnectingService } from '../services/web-socket-connecting.service';
import { FormsModule } from '@angular/forms';
import { Rating } from 'primeng/rating';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Badge } from 'primeng/badge';
import { Chip } from 'primeng/chip';
import { BlockUI } from 'primeng/blockui';
import { Panel } from 'primeng/panel';
import { timer, filter, map } from 'rxjs';

@Component({
  selector: 'app-konfi-selection',
  imports: [
    CommonModule,
    FormsModule,
    Rating,
    NgOptimizedImage,
    Card,
    ProgressSpinner,
    Toast,
    Badge,
    Chip,
    BlockUI,
    Panel
  ],
  providers: [MessageService],
  template: `
    <div class="h-screen w-full relative" role="main" aria-labelledby="voting-title"
         (keydown)="onKeyDown($event)" tabindex="-1">
      <h1 id="voting-title" class="sr-only">Brunch Rating Voting Interface</h1>

      <!-- Screen Reader Skip Navigation -->
      <a href="#voting-content" class="sr-only" (click)="focusVotingSection()">Skip to voting section</a>
      <p-toast position="top-center" [breakpoints]="{'920px': {width: '100%', right: '0', left: '0'}}"
               role="alert" aria-live="polite">
      </p-toast>

      <!-- BlockUI overlay for vote submission -->
      <p-blockUI [blocked]="isVoteSubmitting()" [target]="'.rating-container'"
                 role="dialog" aria-modal="true" aria-labelledby="submit-status">
        <div class="flex align-items-center gap-2">
          <p-progressSpinner class="w-2rem h-2rem" strokeWidth="6"
                            role="status" aria-label="Submitting vote"></p-progressSpinner>
          <span id="submit-status">Vote wird gesendet...</span>
        </div>
      </p-blockUI>

      <!-- Connection Status Indicator (Minimal) -->
      @if (connectionStatus() === 'disconnected') {
        <div class="fixed top-0 right-0 m-2 z-5" role="status" aria-live="polite">
          <p-chip label="Offline"
                  icon="pi pi-wifi-off"
                  class="bg-red-50 text-red-700 text-xs"
                  size="small">
          </p-chip>
        </div>
      }

      <!-- Main Content -->
      <div class="grid h-full w-full p-2 md:p-4 lg:p-6 align-content-center">
        <div class="col-12 xl:col-8 xl:col-offset-2">

          <!-- User Greeting Card -->
          <p-card class="mb-3 md:mb-4 text-center shadow-1">
            <div class="flex align-items-center justify-content-center gap-2 flex-wrap">
              <span class="text-base md:text-lg">Willkommen</span>
              <p-chip [label]="nameService.username"
                      icon="pi pi-user"
                      class="bg-primary-50 text-primary-800">
              </p-chip>
            </div>
          </p-card>

          <!-- Voting Section -->
          <p-panel header="Dein Voting" class="rating-container shadow-1">
            <div class="text-center px-2 md:px-4">

              <!-- Current Vote Display -->
              @if (value > 0) {
                <div class="mb-4">
                  <div class="flex align-items-center justify-content-center gap-2 mb-3">
                    <p-badge [value]="value.toString()"
                             severity="success"
                             size="large"
                             class="text-xl md:text-2xl">
                    </p-badge>
                    <span class="text-sm md:text-base text-color-secondary">von 5</span>
                  </div>
                </div>
              }

              <!-- Rating Component with Responsive Sizing -->
              <div class="rating-wrapper flex justify-content-center mb-4"
                   [class.disabled]="isVoteSubmitting()"
                   role="group"
                   aria-labelledby="rating-instructions"
                   [attr.aria-busy]="isVoteSubmitting()">
                <div id="rating-instructions" class="sr-only">
                  Verwende die Pfeiltasten oder klicke, um deine Bewertung von 1 bis 5 Konfitüren auszuwählen
                </div>
                <p-rating
                  [ngModel]="value"
                  (ngModelChange)="select($event)"
                  [disabled]="isVoteSubmitting()"
                  class="custom-rating responsive-rating"
                  [attr.aria-label]="'Aktuelle Bewertung: ' + (value > 0 ? value + ' von 5 Konfitüren' : 'Keine Bewertung ausgewählt')"
                  [attr.aria-describedby]="'rating-help rating-status'">
                  <ng-template #onicon>
                    <img
                      ngSrc="konfi.svg"
                      alt="Gefüllte Konfitüre"
                      [height]="80"
                      [width]="80"
                      priority
                      [class.pulse-animation]="isVoteSubmitting()"
                      role="img"
                      aria-hidden="true"
                      class="rating-icon"
                    />
                  </ng-template>
                  <ng-template #officon>
                    <img
                      ngSrc="konfi_gray.svg"
                      alt="Leere Konfitüre"
                      [height]="80"
                      [width]="80"
                      priority
                      role="img"
                      aria-hidden="true"
                      class="rating-icon"
                    />
                  </ng-template>
                </p-rating>
                <div id="rating-help" class="sr-only" aria-live="polite">
                  @if (value > 0) {
                    Ausgewählt: {{ value }} von 5 Konfitüren. Drücke Escape zum Zurücksetzen.
                  } @else {
                    Keine Bewertung ausgewählt. Verwende die Maus oder Pfeiltasten zur Auswahl.
                  }
                </div>
                <div id="rating-status" class="sr-only" aria-live="assertive">
                  @if (isVoteSubmitting()) {
                    Vote wird gesendet, bitte warten...
                  }
                </div>
              </div>

              <!-- Vote Feedback (Simplified) -->
              @if (lastVoteStatus()) {
                <div class="mb-3">
                  @switch (lastVoteStatus()) {
                    @case ('success') {
                      <div class="flex align-items-center justify-content-center gap-2 text-green-600 text-sm">
                        <i class="pi pi-check" aria-hidden="true"></i>
                        <span>Gespeichert!</span>
                      </div>
                    }
                    @case ('error') {
                      <div class="flex align-items-center justify-content-center gap-2 text-red-600 text-sm">
                        <i class="pi pi-times" aria-hidden="true"></i>
                        <span>Fehler beim Speichern</span>
                      </div>
                    }
                  }
                </div>
              }

              <!-- Instructions (Simplified) -->
              <div class="text-center">
                <p class="text-sm md:text-base text-color-secondary mb-2">
                  Klicke auf die Konfitüren um deine Bewertung abzugeben
                </p>
                @if (connectionStatus() === 'disconnected') {
                  <p class="text-red-600 text-xs">
                    <i class="pi pi-wifi-off mr-1" aria-hidden="true"></i>
                    Offline - wird automatisch synchronisiert
                  </p>
                }
              </div>

            </div>
          </p-panel>

        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .rating-wrapper.disabled {
      pointer-events: none;
      opacity: 0.6;
      transition: opacity 0.3s ease;
    }

    .rating-wrapper {
      transition: all 0.3s ease;
    }

    /* Responsive rating icons */
    .rating-icon {
      width: 60px !important;
      height: 60px !important;
      transition: all 0.3s ease;
    }

    @media (min-width: 768px) {
      .rating-icon {
        width: 80px !important;
        height: 80px !important;
      }
    }

    @media (min-width: 1024px) {
      .rating-icon {
        width: 100px !important;
        height: 100px !important;
      }
    }

    .custom-rating .p-rating-item:hover .rating-icon {
      transform: scale(1.1);
    }

    .custom-rating .p-rating-item.p-rating-item-active .rating-icon {
      filter: drop-shadow(0 0 8px rgba(var(--p-primary-400), 0.4));
    }

    .pulse-animation {
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .fixed {
      position: fixed;
    }

    .z-5 {
      z-index: 1050;
    }

    /* Responsive spacing adjustments */
    @media (max-width: 767px) {
      .custom-rating {
        gap: 0.25rem;
      }
    }

    @media (min-width: 768px) {
      .custom-rating {
        gap: 0.5rem;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KonfiSelectionComponent implements AfterViewInit {
  public readonly nameService = inject(NameService);
  private readonly webSocketService = inject(WebSocketConnectingService);
  private readonly messageService = inject(MessageService);
  private readonly plattform = inject(PLATFORM_ID);

  public value = 0;
  id = input<string>();

  // Reactive state signals
  connectionStatus = signal<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting');
  isVoteSubmitting = signal(false);
  lastVoteStatus = signal<'success' | 'error' | null>(null);


  public onKeyDown(event: KeyboardEvent) {
    // Handle global keyboard shortcuts for the voting interface
    if (event.target === document.body || (event.target as HTMLElement).tagName === 'DIV') {
      switch(event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          { event.preventDefault();
          const rating = parseInt(event.key);
          this.select(rating);
          this.announceFocusChange(`Bewertung ${rating} ausgewählt`);
          break; }
        case 'Escape':
          event.preventDefault();
          this.value = 0;
          this.messageService.add({
            severity: 'info',
            summary: 'Bewertung zurückgesetzt',
            detail: 'Keine Bewertung ausgewählt',
            life: 1500
          });
          break;
        case 'h':
        case 'H':
          // Help shortcut
          event.preventDefault();
          this.announceHelp();
          break;
      }
    }
  }

  public focusVotingSection() {
    // Focus the voting section for keyboard navigation
    const votingSection = document.getElementById('voting-content');
    if (votingSection) {
      votingSection.focus();
    }
  }

  private announceFocusChange(message: string) {
    // Announce focus changes to screen readers
    this.messageService.add({
      severity: 'info',
      summary: 'Navigation',
      detail: message,
      life: 1000
    });
  }

  private announceHelp() {
    // Announce keyboard shortcuts help
    this.messageService.add({
      severity: 'info',
      summary: 'Tastaturhilfe',
      detail: 'Drücke 1-5 für Bewertung, Escape zum Zurücksetzen, H für Hilfe',
      life: 4000
    });
  }

  public select(vote: number) {
    if (this.isVoteSubmitting()) return;

    this.value = vote;
    this.isVoteSubmitting.set(true);
    this.lastVoteStatus.set(null);


    this.webSocketService.updateKonfiVote$(
      <string>this.id(),
      this.nameService.username,
      vote
    ).subscribe({
      next: ({status})=>{
        if (status === 'success') {
          this.lastVoteStatus.set('success');
          this.messageService.add({
            severity: 'success',
            summary: 'Vote gespeichert',
            detail: `Deine Bewertung (${vote}/5) wurde erfolgreich gespeichert`,
            life: 3000
          });
        }
        if (status === 'error' || status === 'unknown') {
          this.lastVoteStatus.set('error');
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Vote konnte nicht gespeichert werden',
            life: 4000
          });
        }
        if (status === 'loading') {
          this.messageService.add({
            severity: 'info',
            summary: 'Vote wird gesendet',
            detail: `Bewertung: ${vote}/5 Konfitüren`,
            life: 2000
          });
        }
      },
      error: err => {
        this.isVoteSubmitting.set(false);
        this.lastVoteStatus.set(null);
        this.lastVoteStatus.set('error');
        this.messageService.add({
          severity: 'error',
          summary: 'Fehler',
          detail: 'Vote konnte nicht gespeichert werden',
          life: 4000
        });
      },
      complete: () => {
        this.isVoteSubmitting.set(false);
        this.lastVoteStatus.set(null);
      }
    })



  }

  constructor() {
    afterNextRender(() => {
      this.webSocketService.joinTable(
        <string>this.id(),
        this.nameService.username
      );
    });
  }

  ngAfterViewInit(): void {
    console.log(this.plattform);

    if (isPlatformBrowser(this.plattform)) {
      // Subscribe to connection status
      this.webSocketService.connectionStatus$.subscribe(status => {
        this.connectionStatus.set(status);

        // Show connection status changes
        switch(status) {
          case 'connected':
            this.messageService.add({
              severity: 'success',
              summary: 'Verbunden',
              detail: 'Erfolgreich mit dem Server verbunden',
              life: 2000
            });
            break;
          case 'disconnected':
            this.messageService.add({
              severity: 'error',
              summary: 'Verbindung verloren',
              detail: 'Die Verbindung zum Server wurde unterbrochen',
              life: 5000
            });
            break;
          case 'reconnecting':
            this.messageService.add({
              severity: 'info',
              summary: 'Verbinde neu',
              detail: 'Versuche die Verbindung wiederherzustellen...',
              life: 3000
            });
            break;
        }
      });

      // Subscribe to operation status for additional feedback
      this.webSocketService.operationStatus$
        .pipe(filter(status => status.type === 'join'))
        .subscribe(status => {
          if (status.status === 'success') {
            this.messageService.add({
              severity: 'success',
              summary: 'Tisch beigetreten',
              detail: 'Du bist dem Tisch erfolgreich beigetreten',
              life: 3000
            });
          }
        });

      // Observe table for real-time updates
      this.webSocketService.observeTable(<string>this.id())
        .pipe(filter(res => res !== null))
        .subscribe((res) => {
          console.log('Table update received:', res);

          // Show notifications for other user activities
          if (res && res.user !== this.nameService.username) {
            switch(res.type) {
              case 'JOIN':
                this.messageService.add({
                  severity: 'info',
                  summary: 'Neuer Teilnehmer',
                  detail: `${res.user} ist dem Tisch beigetreten`,
                  life: 2000
                });
                break;
              case 'UPDATE':
                this.messageService.add({
                  severity: 'info',
                  summary: 'Vote Update',
                  detail: `${res.user} hat sein Vote aktualisiert`,
                  life: 1500
                });
                break;
              case 'LEAVE':
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Teilnehmer verlassen',
                  detail: `${res.user} hat den Tisch verlassen`,
                  life: 2000
                });
                break;
            }
          }
        });

      // Initialize with a neutral vote
      this.webSocketService.updateKonfiVote(
        <string>this.id(),
        this.nameService.username,
        0
      );
    }
  }
}
