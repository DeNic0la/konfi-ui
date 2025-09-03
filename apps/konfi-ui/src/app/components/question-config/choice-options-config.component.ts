import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormArray, FormControl, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { InputNumber } from 'primeng/inputnumber';
import { Tooltip } from 'primeng/tooltip';

export interface ChoiceOptionsConfig {
  options: string[];
  minChoices?: number;
  maxChoices?: number;
  allowOther?: boolean;
}

@Component({
  selector: 'app-choice-options-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputText,
    Checkbox,
    InputNumber,
    Tooltip
  ],
  template: `
    <div class="choice-options-config">
      <label class="block text-sm font-medium mb-2">Options *</label>
      
      <div class="options-list space-y-2 mb-3">
        <div 
          *ngFor="let optionControl of optionsFormArray.controls; trackBy: trackByIndex; let i = index"
          class="flex align-items-center gap-2"
        >
          <div class="flex-1">
            <input 
              pInputText
              [formControl]="optionControl"
              [placeholder]="'Option ' + (i + 1)"
              class="w-full"
              [class.p-invalid]="optionControl.invalid && optionControl.touched"
            />
            <small 
              *ngIf="optionControl.invalid && optionControl.touched" 
              class="p-error block mt-1"
            >
              Option is required and must be under 200 characters
            </small>
          </div>
          
          <p-button 
            icon="pi pi-times"
            severity="danger"
            [text]="true"
            [rounded]="true"
            size="small"
            (onClick)="removeOption(i)"
            [disabled]="optionsFormArray.length <= 2"
            pTooltip="Remove option"
            tooltipPosition="top"
          />
        </div>
      </div>

      <div class="flex justify-content-between align-items-center mb-4">
        <p-button 
          label="Add Option"
          icon="pi pi-plus"
          [text]="true"
          size="small"
          (onClick)="addOption()"
          [disabled]="optionsFormArray.length >= 10"
          pTooltip="Add new option (max 10)"
        />
        
        <small class="text-500">
          {{ optionsFormArray.length }}/10 options
        </small>
      </div>

      <!-- Constraints for Multiple Choice -->
      <div *ngIf="showConstraints" class="constraints-section">
        <label class="block text-sm font-medium mb-3">Selection Constraints</label>
        
        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="minChoices" class="block text-xs mb-1">Minimum Selections</label>
            <p-inputnumber 
              id="minChoices"
              [(ngModel)]="minChoices"
              [min]="0"
              [max]="maxChoices || optionsFormArray.length"
              [showButtons]="true"
              [step]="1"
              class="w-full"
              (onInput)="onConstraintsChange()"
              placeholder="0"
            />
            <small class="text-xs text-500 block mt-1">
              Minimum number of options users must select
            </small>
          </div>
          
          <div class="col-12 md:col-6">
            <label for="maxChoices" class="block text-xs mb-1">Maximum Selections</label>
            <p-inputnumber 
              id="maxChoices"
              [(ngModel)]="maxChoices"
              [min]="minChoices || 1"
              [max]="optionsFormArray.length"
              [showButtons]="true"
              [step]="1"
              class="w-full"
              (onInput)="onConstraintsChange()"
              [placeholder]="optionsFormArray.length.toString()"
            />
            <small class="text-xs text-500 block mt-1">
              Maximum number of options users can select
            </small>
          </div>
        </div>
      </div>

      <!-- Allow Other Option -->
      <div class="mt-4">
        <div class="flex align-items-center gap-2">
          <p-checkbox 
            [(ngModel)]="allowOther"
            binary="true"
            inputId="allowOther"
            (onChange)="onAllowOtherChange()"
          />
          <label for="allowOther" class="text-sm">
            Allow "Other" option with text input
          </label>
        </div>
        <small class="text-xs text-500 block mt-1">
          Users can specify a custom response not listed above
        </small>
      </div>

      <!-- Validation Errors -->
      <div *ngIf="optionsFormArray.invalid && optionsFormArray.touched" class="mt-3">
        <small class="p-error block">
          <i class="pi pi-exclamation-triangle mr-1"></i>
          At least 2 options are required, maximum 10 allowed
        </small>
      </div>
    </div>
  `,
  styles: [`
    .choice-options-config {
      .options-list {
        max-height: 300px;
        overflow-y: auto;
      }
      
      .constraints-section {
        border-top: 1px solid var(--surface-border);
        padding-top: 1rem;
        margin-top: 1rem;
      }
      
      :host ::ng-deep {
        .p-inputnumber-input {
          text-align: center;
        }
        
        .p-button.p-button-text {
          padding: 0.375rem;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChoiceOptionsConfigComponent implements OnInit, OnDestroy {
  @Input() options: string[] = ['Option 1', 'Option 2'];
  @Input() minChoices?: number;
  @Input() maxChoices?: number;
  @Input() allowOther = false;
  @Input() showConstraints = false;

  @Output() optionsChange = new EventEmitter<string[]>();
  @Output() constraintsChange = new EventEmitter<{ minChoices?: number; maxChoices?: number }>();
  @Output() allowOtherChange = new EventEmitter<boolean>();

  optionsFormArray: FormArray<FormControl<any>> = new FormArray<FormControl<any>>([]);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeFormArray();
    this.setupFormArraySubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFormArray(): void {
    const controls = this.options.map(option => 
      new FormControl(option, [
        Validators.required,
        Validators.maxLength(200)
      ])
    );

    this.optionsFormArray = new FormArray(controls, [
      Validators.minLength(2),
      Validators.maxLength(10)
    ]);
  }

  private setupFormArraySubscription(): void {
    this.optionsFormArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(values => {
        const validOptions = values.filter((option: string) => option && option.trim());
        if (validOptions.length !== this.options.length || 
            !validOptions.every((option: string, index: number) => option === this.options[index])) {
          this.options = validOptions;
          this.optionsChange.emit(this.options);
        }
      });
  }

  addOption(): void {
    if (this.optionsFormArray.length < 10) {
      const newIndex = this.optionsFormArray.length + 1;
      this.optionsFormArray.push(
        new FormControl(`Option ${newIndex}`, [
          Validators.required,
          Validators.maxLength(200)
        ])
      );
    }
  }

  removeOption(index: number): void {
    if (this.optionsFormArray.length > 2) {
      this.optionsFormArray.removeAt(index);
      
      // Update constraints if they exceed new option count
      if (this.maxChoices && this.maxChoices > this.optionsFormArray.length) {
        this.maxChoices = this.optionsFormArray.length;
        this.onConstraintsChange();
      }
    }
  }

  onConstraintsChange(): void {
    // Validate constraints
    if (this.minChoices !== undefined && this.maxChoices !== undefined) {
      if (this.minChoices > this.maxChoices) {
        this.minChoices = this.maxChoices;
      }
    }

    if (this.maxChoices !== undefined && this.maxChoices > this.optionsFormArray.length) {
      this.maxChoices = this.optionsFormArray.length;
    }

    this.constraintsChange.emit({
      minChoices: this.minChoices,
      maxChoices: this.maxChoices
    });
  }

  onAllowOtherChange(): void {
    this.allowOtherChange.emit(this.allowOther);
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Public API for parent components
  isValid(): boolean {
    return this.optionsFormArray.valid && this.options.length >= 2;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    if (this.optionsFormArray.length < 2) {
      errors.push('At least 2 options are required');
    }

    if (this.optionsFormArray.length > 10) {
      errors.push('Maximum 10 options allowed');
    }

    this.optionsFormArray.controls.forEach((control, index) => {
      if (control.invalid) {
        if (control.errors?.['required']) {
          errors.push(`Option ${index + 1} is required`);
        }
        if (control.errors?.['maxlength']) {
          errors.push(`Option ${index + 1} is too long (max 200 characters)`);
        }
      }
    });

    if (this.showConstraints) {
      if (this.minChoices !== undefined && this.maxChoices !== undefined && this.minChoices > this.maxChoices) {
        errors.push('Minimum selections cannot exceed maximum selections');
      }
    }

    return errors;
  }
}