import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Panel } from 'primeng/panel';
import { Tooltip } from 'primeng/tooltip';

export interface RatingConfig {
  minRating: number;
  maxRating: number;
  labels?: {
    min: string;
    max: string;
  };
}

export interface RatingStepOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-rating-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputNumber,
    InputText,
    Panel,
    Tooltip
  ],
  template: `
    <div class="rating-config">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label for="minValue" class="block text-sm font-medium mb-2">
            Minimum Value *
          </label>
          <p-inputnumber 
            id="minValue"
            [(ngModel)]="minRating"
            [min]="1"
            [max]="maxRating - 1"
            [showButtons]="true"
            [step]="1"
            class="w-full"
            (onInput)="onConfigChange()"
            placeholder="1"
            pTooltip="Lowest rating value users can select"
          />
        </div>
        
        <div class="col-12 md:col-6">
          <label for="maxValue" class="block text-sm font-medium mb-2">
            Maximum Value *
          </label>
          <p-inputnumber 
            id="maxValue"
            [(ngModel)]="maxRating"
            [min]="minRating + 1"
            [max]="10"
            [showButtons]="true"
            [step]="1"
            class="w-full"
            (onInput)="onConfigChange()"
            placeholder="5"
            pTooltip="Highest rating value users can select"
          />
        </div>
      </div>

      <!-- Scale Information -->
      <div class="scale-info mt-3 p-3 surface-100 border-round">
        <div class="flex justify-content-between align-items-center text-sm">
          <span class="font-medium">Scale:</span>
          <span class="text-primary font-semibold">
            {{ minRating }} to {{ maxRating }} 
            ({{ scaleRange }} {{ scaleRange === 1 ? 'point' : 'points' }})
          </span>
        </div>
      </div>

      <!-- Labels Configuration -->
      <div class="labels-section mt-4">
        <label class="block text-sm font-medium mb-3">Scale Labels (Optional)</label>
        
        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="minLabel" class="block text-xs mb-1">
              Low End Label ({{ minRating }})
            </label>
            <input 
              pInputText
              id="minLabel"
              [(ngModel)]="labels.min"
              placeholder="e.g., Poor, Never, Strongly Disagree"
              class="w-full"
              maxlength="50"
              (input)="onConfigChange()"
              pTooltip="Label shown for the minimum rating value"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label for="maxLabel" class="block text-xs mb-1">
              High End Label ({{ maxRating }})
            </label>
            <input 
              pInputText
              id="maxLabel"
              [(ngModel)]="labels.max"
              placeholder="e.g., Excellent, Always, Strongly Agree"
              class="w-full"
              maxlength="50"
              (input)="onConfigChange()"
              pTooltip="Label shown for the maximum rating value"
            />
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <p-panel header="Preview" class="mt-4" [toggleable]="true" [collapsed]="false">
        <div class="preview-content text-center py-3">
          <div class="mb-3">
            <span class="text-600 text-sm">Rate this item:</span>
          </div>
          
          <div class="rating-preview-container">
            <!-- Custom Rating Display -->
            <div class="custom-rating flex justify-content-center align-items-center gap-1 mb-3">
              <button 
                *ngFor="let star of previewStars; trackBy: trackByIndex; let i = index"
                type="button"
                class="rating-star"
                [class.active]="i < previewValue"
                (click)="setPreviewValue(i + 1)"
                [attr.aria-label]="'Rate ' + (i + 1)"
              >
                <i class="pi pi-star-fill"></i>
              </button>
            </div>
            
            <!-- Rating Value Display -->
            <div class="rating-value text-sm text-600 mb-2">
              <span *ngIf="previewValue > 0">
                Rating: {{ previewValue + minRating - 1 }}
              </span>
              <span *ngIf="previewValue === 0" class="text-400">
                Click to rate
              </span>
            </div>
            
            <!-- Labels Display -->
            <div *ngIf="labels.min || labels.max" class="rating-labels flex justify-content-between text-xs text-500 mt-2">
              <span>{{ labels.min || minRating }}</span>
              <span>{{ labels.max || maxRating }}</span>
            </div>
          </div>
          
          <small class="block text-400 mt-3">
            This is how the rating will appear to users
          </small>
        </div>
      </p-panel>

      <!-- Validation Errors -->
      <div *ngIf="!isValid()" class="mt-3">
        <small class="p-error block" *ngFor="let error of getValidationErrors()">
          <i class="pi pi-exclamation-triangle mr-1"></i>
          {{ error }}
        </small>
      </div>
    </div>
  `,
  styles: [`
    .rating-config {
      .scale-info {
        border-left: 3px solid var(--primary-color);
      }
      
      .labels-section {
        border-top: 1px solid var(--surface-border);
        padding-top: 1rem;
      }
      
      .custom-rating {
        .rating-star {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--text-color-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0.25rem;
          border-radius: 50%;
          
          &:hover {
            color: var(--primary-color);
            transform: scale(1.1);
          }
          
          &.active {
            color: var(--primary-color);
          }
          
          i {
            display: block;
          }
        }
      }
      
      .rating-preview-container {
        background: var(--surface-50);
        border: 1px solid var(--surface-border);
        border-radius: var(--border-radius);
        padding: 1rem;
      }
      
      :host ::ng-deep {
        .p-inputnumber-input {
          text-align: center;
        }
        
        .p-panel-header {
          padding: 0.75rem 1rem;
        }
        
        .p-panel-content {
          padding: 1rem;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingConfigComponent implements OnInit {
  @Input() minRating = 1;
  @Input() maxRating = 5;
  @Input() labels: { min: string; max: string } = { min: '', max: '' };

  @Output() configChange = new EventEmitter<RatingConfig>();

  previewValue = 0;
  previewStars: number[] = [];

  ngOnInit(): void {
    this.updatePreviewStars();
  }

  get scaleRange(): number {
    return this.maxRating - this.minRating + 1;
  }

  onConfigChange(): void {
    // Validate range
    if (this.minRating >= this.maxRating) {
      this.maxRating = this.minRating + 1;
    }

    // Ensure values are within bounds
    if (this.minRating < 1) this.minRating = 1;
    if (this.maxRating > 10) this.maxRating = 10;
    if (this.minRating > 9) this.minRating = 9;

    this.updatePreviewStars();
    this.resetPreviewValue();

    this.configChange.emit({
      minRating: this.minRating,
      maxRating: this.maxRating,
      labels: this.labels.min || this.labels.max ? { ...this.labels } : undefined
    });
  }

  private updatePreviewStars(): void {
    this.previewStars = Array(this.scaleRange).fill(0).map((_, i) => i + 1);
  }

  private resetPreviewValue(): void {
    if (this.previewValue > this.scaleRange) {
      this.previewValue = 0;
    }
  }

  setPreviewValue(value: number): void {
    this.previewValue = value;
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Validation methods
  isValid(): boolean {
    return this.getValidationErrors().length === 0;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    if (this.minRating < 1) {
      errors.push('Minimum rating must be at least 1');
    }

    if (this.maxRating > 10) {
      errors.push('Maximum rating cannot exceed 10');
    }

    if (this.minRating >= this.maxRating) {
      errors.push('Maximum rating must be greater than minimum rating');
    }

    if (this.scaleRange < 2) {
      errors.push('Rating scale must have at least 2 points');
    }

    if (this.scaleRange > 10) {
      errors.push('Rating scale cannot have more than 10 points');
    }

    if (this.labels.min && this.labels.min.length > 50) {
      errors.push('Low end label must be under 50 characters');
    }

    if (this.labels.max && this.labels.max.length > 50) {
      errors.push('High end label must be under 50 characters');
    }

    return errors;
  }

  // Helper methods for different rating scales
  getScaleTypeDescription(): string {
    const range = this.scaleRange;
    
    if (range <= 3) return 'Simple scale (good for basic feedback)';
    if (range <= 5) return 'Standard scale (most common)';
    if (range <= 7) return 'Detailed scale (good for nuanced feedback)';
    return 'Comprehensive scale (maximum detail)';
  }

  // Preset configurations
  applyPreset(preset: 'likert5' | 'satisfaction' | 'confidence' | 'agreement'): void {
    switch (preset) {
      case 'likert5':
        this.minRating = 1;
        this.maxRating = 5;
        this.labels = {
          min: 'Strongly Disagree',
          max: 'Strongly Agree'
        };
        break;
      
      case 'satisfaction':
        this.minRating = 1;
        this.maxRating = 5;
        this.labels = {
          min: 'Very Dissatisfied',
          max: 'Very Satisfied'
        };
        break;
      
      case 'confidence':
        this.minRating = 1;
        this.maxRating = 10;
        this.labels = {
          min: 'Not Confident',
          max: 'Very Confident'
        };
        break;
      
      case 'agreement':
        this.minRating = 1;
        this.maxRating = 7;
        this.labels = {
          min: 'Completely Disagree',
          max: 'Completely Agree'
        };
        break;
    }
    
    this.onConfigChange();
  }
}