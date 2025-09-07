import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation,
  signal,
  computed,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AutoFocus } from 'primeng/autofocus';

@Component({
  selector: 'app-name-input',
  imports: [
    CommonModule,
    FloatLabelModule,
    InputText,
    FormsModule,
    ButtonDirective,
    Card,
    ProgressSpinner,
    Toast,
    AutoFocus,
  ],
  providers: [MessageService],
  template: `
    <div
      class="h-screen w-full flex align-items-center justify-content-center p-4"
    >
      <p-toast
        position="top-center"
        [breakpoints]="{ '920px': { width: '100%', right: '0', left: '0' } }"
      ></p-toast>

      <p-card class="w-full max-w-md">
        <ng-template pTemplate="header">
          <div class="text-center py-4">
            <i class="pi pi-user text-5xl text-primary mb-3 block"></i>
            <h2 class="m-0">Willkommen!</h2>
            <p class="text-color-secondary mt-2 mb-0">
              Gib deinen Namen ein um teilzunehmen
            </p>
          </div>
        </ng-template>

        <div class="flex flex-column gap-4">
          <!-- Name Input with Validation -->
          <div class="field">
            <p-floatlabel>
              <input
                id="username"
                type="text"
                pInputText
                [pAutoFocus]="true"
                [(ngModel)]="tempUsername"
                (input)="onInputChange()"
                (keydown.enter)="confirmName()"
                [disabled]="isProcessing()"
                [class.p-invalid]="showValidationError()"
                class="w-full"
                maxlength="30"
                autocomplete="given-name"
                #usernameInput
              />
              <label for="username">Dein Name</label>
            </p-floatlabel>

            @if (showValidationError()) {
            <small class="p-error block mt-1">
              {{ validationMessage() }}
            </small>
            }
          </div>

          <!-- Input Guidelines -->
          <div class="text-sm text-color-secondary">
            <div class="flex align-items-center gap-2 mb-1">
              <i
                class="pi"
                [class.pi-check]="isValidLength()"
                [class.pi-times]="!isValidLength()"
                [class.text-green-500]="isValidLength()"
                [class.text-red-500]="!isValidLength()"
              ></i>
              <span>2-30 Zeichen</span>
            </div>
            <div class="flex align-items-center gap-2">
              <i
                class="pi"
                [class.pi-check]="!hasInvalidChars()"
                [class.pi-times]="hasInvalidChars()"
                [class.text-green-500]="!hasInvalidChars()"
                [class.text-red-500]="hasInvalidChars()"
              ></i>
              <span>Nur Buchstaben, Zahlen und Leerzeichen</span>
            </div>
          </div>

          <!-- Confirm Button -->
          <button
            pButton
            type="button"
            label="Beitreten"
            icon="pi pi-check"
            [loading]="isProcessing()"
            [disabled]="!isFormValid() || isProcessing()"
            (click)="confirmName()"
            class="w-full mt-2"
            severity="primary"
            size="large"
          ></button>

          <!-- Processing Feedback -->
          @if (isProcessing()) {
          <div
            class="flex align-items-center justify-content-center gap-2 text-primary"
          >
            <p-progressSpinner
              styleClass="w-1rem h-1rem"
              strokeWidth="6"
            ></p-progressSpinner>
            <span class="text-sm">Trete dem Tisch bei...</span>
          </div>
          }
        </div>
      </p-card>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .max-w-md {
      max-width: 28rem;
    }

    .field {
      position: relative;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NameInputComponent {
  private readonly messageService = inject(MessageService);

  // Component state
  tempUsername = signal('');
  isProcessing = signal(false);
  showValidationError = signal(false);
  declareUsername = output<string>();

  // Computed validations
  isValidLength = computed(() => {
    const name = this.tempUsername().trim();
    return name.length >= 2 && name.length <= 30;
  });

  hasInvalidChars = computed(() => {
    const name = this.tempUsername().trim();
    // Allow letters, numbers, spaces, and basic punctuation
    return !/^[a-zA-Z0-9\s\-_.äöüÄÖÜß]*$/.test(name);
  });

  isFormValid = computed(() => {
    return (
      this.isValidLength() &&
      !this.hasInvalidChars() &&
      this.tempUsername().trim().length > 0
    );
  });

  validationMessage = computed(() => {
    const name = this.tempUsername().trim();

    if (name.length === 0) {
      return 'Bitte gib deinen Namen ein';
    }
    if (name.length < 2) {
      return 'Name muss mindestens 2 Zeichen haben';
    }
    if (name.length > 30) {
      return 'Name darf maximal 30 Zeichen haben';
    }
    if (this.hasInvalidChars()) {
      return 'Name enthält ungültige Zeichen';
    }

    return '';
  });

  onInputChange() {
    // Clear validation error when user starts typing
    if (this.showValidationError()) {
      this.showValidationError.set(false);
    }
  }

  confirmName() {
    this.isProcessing.set(true);

    const trimmedName = this.tempUsername().trim();

    // Validate input
    if (!this.isFormValid()) {
      this.showValidationError.set(true);
      this.messageService.add({
        severity: 'error',
        summary: 'Ungültiger Name',
        detail: this.validationMessage(),
        life: 4000,
      });
      this.isProcessing.set(false);
      return;
    }

    this.declareUsername.emit(trimmedName);
  }
}
