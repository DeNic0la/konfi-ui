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
  computed, HostListener,
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
import {
  timer,
  filter,
  map,
  Subject,
  debounce,
  debounceTime,
  switchMap,
  catchError,
  of,
  endWith,
  distinctUntilChanged, shareReplay, takeUntil, takeWhile, finalize, startWith, scan, BehaviorSubject, defer, NEVER, tap
} from 'rxjs';
import { toSignal} from "@angular/core/rxjs-interop";
import {LetDirective} from "@ngrx/component";

@Component({
  selector: 'app-konfi-selection',
  imports: [
    CommonModule,
    FormsModule,
    Rating,
    NgOptimizedImage,
    Card,
    ProgressSpinner,
    Badge,
    Chip,
    BlockUI,
    Panel,
    LetDirective
  ],
  providers: [],
  template: `
    <div class="h-screen w-full relative" role="main" aria-labelledby="voting-title"
         *ngrxLet="canSubmitVote$ as canVote"
         tabindex="-1">
      <h1 id="voting-title" class="sr-only">Brunch Rating Voting Interface</h1>

      <!-- Screen Reader Skip Navigation -->
      <a href="#voting-content" class="sr-only" (click)="focusVotingSection()">Skip to voting section</a>


      <!-- BlockUI overlay for vote submission -->



      <!-- Main Content -->
      <div class="grid h-full w-full p-2 md:p-4 lg:p-6 align-content-center">
        <div class="col-12 xl:col-8 xl:col-offset-2">

          <!-- User Greeting Card -->
          <p-card class="mb-3 md:mb-4 text-center shadow-1">
            <div class="flex align-items-center justify-content-center gap-2 flex-wrap">
              <span class="text-base md:text-lg">Willkommen</span>
              <p-chip [label]="username()"
                      icon="pi pi-user"
                      class="bg-primary-50 text-primary-800">
              </p-chip>
            </div>
          </p-card>

          <!-- Voting Section -->
          <p-panel header="Dein Voting" class="rating-container shadow-1">
            <div class="text-center px-2 md:px-4">

              <!-- Current Vote Display -->
              @if (selectKonfi$.value > 0) {
                <div class="mb-4">
                  <div class="flex align-items-center justify-content-center gap-2 mb-3">
                    <p-badge [value]="selectKonfi$.value.toString()"
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
                   [class.disabled]="!canVote"
                   role="group"
                   aria-labelledby="rating-instructions"
                   [attr.aria-busy]="!canVote">
                <div id="rating-instructions" class="sr-only">
                  Verwende die Pfeiltasten oder klicke, um deine Bewertung von 1 bis 5 Konfitüren auszuwählen
                </div>
                <p-rating
                  [ngModel]="selectKonfi$.value"
                  (ngModelChange)="select($event)"
                  [disabled]="!canVote"
                  class="custom-rating responsive-rating"
                  [attr.aria-label]="'Aktuelle Bewertung: ' + (selectKonfi$.value > 0 ? selectKonfi$.value + ' von 5 Konfitüren' : 'Keine Bewertung ausgewählt')"
                  [attr.aria-describedby]="'rating-help rating-status'">
                  <ng-template #onicon>
                    <img
                      ngSrc="konfi.svg"
                      alt="Gefüllte Konfitüre"
                      [height]="80"
                      [width]="80"
                      priority
                      [class.pulse-animation]="!canVote"
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
                  @if (selectKonfi$.value > 0) {
                    Ausgewählt: {{ selectKonfi$.value }} von 5 Konfitüren. Drücke Escape zum Zurücksetzen.
                  } @else {
                    Keine Bewertung ausgewählt. Verwende die Maus oder Pfeiltasten zur Auswahl.
                  }
                </div>
                <div id="rating-status" class="sr-only" aria-live="assertive">
                  @if (!canVote) {
                    Vote wird gesendet, bitte warten...
                  }
                </div>
              </div>

              <!-- Vote Feedback (Simplified) -->
              @if ( hasSavedVote()) {
                <div class="mb-3">
                  @switch (lastStatus()) {
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
export class KonfiSelectionComponent  {
  private readonly webSocketService = inject(WebSocketConnectingService);
  private readonly messageService = inject(MessageService);
  id = input<string>();
  username = input<string>();

  // Reactive state signals
  public readonly selectKonfi$ = new BehaviorSubject<number>(0);

  public readonly konfiVoteSubmit$ = this.selectKonfi$.pipe(
    switchMap(
      (vote) => this.webSocketService.updateKonfiVote$(
        <string>this.id(),
        <string>this.username(),
        vote
      ).pipe(
        tap(({status})=>{this.generateScreenReaderStatusUpdates(status)}),
        startWith({loading: true}),
        catchError(err => of({status: 'error'})),
        takeWhile((data) => !('status' in data)  || (data.status !== 'success' && data.status !== 'error') ,true),
        endWith({loading:false}),
        scan((acc, curr) => {
          return {...acc, ...curr};
        },{})
      )
    ),
    shareReplay({refCount: true, bufferSize: 1})
  )

  public readonly isLoading$ = this.konfiVoteSubmit$.pipe(
    map(res => 'loading' in res ? res.loading : false),
    distinctUntilChanged(),
    startWith(false),
    shareReplay({refCount: true, bufferSize: 1})
  )
  public readonly lastKonfiSubmit$ = this.konfiVoteSubmit$.pipe(
    filter((data): data is {status: string} => ('status' in data) && typeof data.status === 'string'),
    map<{ status: string }, string>(({status}) => status),
    distinctUntilChanged(),
    startWith(false),
    tap(()=> {this.hasSavedVote.set(true)}),
    shareReplay({refCount: true, bufferSize: 1})
  )
  public readonly canSubmitVote$ = this.webSocketService.connectionStatus$.pipe(
    map((status) => status === 'connected'),
    distinctUntilChanged(),
    switchMap((connected) =>
      connected ?  this.isLoading$.pipe(map(loading => !loading)) : of(false)
    ),
    tap((canSubmit) => {this._blockSelect = !canSubmit}),
    distinctUntilChanged(),
    shareReplay({refCount: true, bufferSize: 1}),
  )
  public lastStatus = toSignal(this.lastKonfiSubmit$, {initialValue: false});
  public hasSavedVote = signal(false)


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
      key: 'sr-only',
      life: 1000
    });
  }

  @HostListener('window:keydown.h', ['$event'])
  public announceHelp(event?: Event) {
    event?.preventDefault();
    // Announce keyboard shortcuts help
    this.messageService.add({
      severity: 'info',
      summary: 'Tastaturhilfe',
      detail: 'Drücke 1-5 für Bewertung, Escape zum Zurücksetzen, H für Hilfe',
      life: 4000
    });
  }

  private generateScreenReaderStatusUpdates(status: string){
    if (status === 'success') {
      this.messageService.add({
        severity: 'success',
        key: 'sr-only',
        summary: 'Vote gespeichert',
        detail: `Deine Bewertung (${this.selectKonfi$.value}/5) wurde erfolgreich gespeichert`,
        life: 3000
      });
    }
    if (status === 'error' || status === 'unknown') {
      this.messageService.add({
        severity: 'error',
        summary: 'Fehler',
        key: 'sr-only',
        detail: 'Vote konnte nicht gespeichert werden',
        life: 4000
      });
    }
    if (status === 'loading') {
      this.messageService.add({
        severity: 'info',
        key: 'sr-only',
        summary: 'Vote wird gesendet',
        detail: `Bewertung: ${this.selectKonfi$.value}/5 Konfitüren`,
        life: 2000
      });
    }
  }

  private _blockSelect = false;
  @HostListener('window:keydow.Escape', ['0','$event'])
  @HostListener('window:keydow.1', ['1','$event'])
  @HostListener('window:keydow.2', ['2','$event'])
  @HostListener('window:keydow.3', ['3','$event'])
  @HostListener('window:keydow.4', ['4','$event'])
  @HostListener('window:keydow.5', ['5','$event'])
  public select(vote: number,event?: Event) {
    if (this._blockSelect) return;
    if (event !== undefined){
      event.preventDefault()
      this.announceFocusChange(`Bewertung ${vote} ausgewählt`);
    }
    this.selectKonfi$.next(vote)
  }





}
