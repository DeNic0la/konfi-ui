import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Checkbox } from 'primeng/checkbox';
import { Panel } from 'primeng/panel';
import { Tooltip } from 'primeng/tooltip';
import { Textarea } from 'primeng/textarea';

export interface TextConfig {
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}

@Component({
  selector: 'app-text-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputText,
    InputNumber,
    Checkbox,
    Panel,
    Tooltip,
    Textarea
  ],
  template: `
    <div class="text-config">
      <!-- Placeholder Configuration -->
      <div class="field">
        <label for="placeholder" class="block text-sm font-medium mb-2">
          Placeholder Text
        </label>
        <input 
          pInputText
          id="placeholder"
          [(ngModel)]="placeholder"
          [placeholder]="defaultPlaceholder"
          class="w-full"
          maxlength="200"
          (input)="onConfigChange()"
          pTooltip="Help text shown when the input is empty"
        />
        <small class="text-xs text-500 block mt-1">
          {{ (placeholder.length || 0) }}/200 characters
        </small>
      </div>

      <!-- Multi-line Option -->
      <div class="field mt-4">
        <div class="flex align-items-center gap-2">
          <p-checkbox 
            [(ngModel)]="multiline"
            binary="true"
            inputId="multiline"
            (onChange)="onConfigChange()"
          />
          <label for="multiline" class="text-sm">
            Allow multi-line responses (textarea)
          </label>
        </div>
        <small class="text-xs text-500 block mt-1">
          Enable this for longer text responses like comments or feedback
        </small>
      </div>

      <!-- Character Limit -->
      <div class="field mt-4">
        <label for="maxLength" class="block text-sm font-medium mb-2">
          Character Limit (Optional)
        </label>
        <p-inputnumber 
          id="maxLength"
          [(ngModel)]="maxLength"
          [min]="1"
          [max]="2000"
          [showButtons]="true"
          [step]="50"
          class="w-full"
          placeholder="No limit"
          (onInput)="onConfigChange()"
          pTooltip="Maximum number of characters users can enter"
        />
        <small class="text-xs text-500 block mt-1">
          Leave empty for unlimited text length (up to 2000 characters)
        </small>
      </div>

      <!-- Length Recommendations -->
      <div class="recommendations mt-3 p-3 surface-100 border-round">
        <div class="text-sm font-medium mb-2">📏 Recommended Limits:</div>
        <div class="grid text-xs">
          <div class="col-12 md:col-6">
            <div class="flex justify-content-between">
              <span>Short answer:</span>
              <strong>50-100 chars</strong>
            </div>
            <div class="flex justify-content-between">
              <span>Name/Title:</span>
              <strong>25-50 chars</strong>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="flex justify-content-between">
              <span>Comment:</span>
              <strong>200-500 chars</strong>
            </div>
            <div class="flex justify-content-between">
              <span>Essay:</span>
              <strong>1000+ chars</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <p-panel header="Preview" class="mt-4" [toggleable]="true" [collapsed]="false">
        <div class="preview-content py-3">
          <div class="mb-3">
            <span class="text-600 text-sm">Sample question preview:</span>
          </div>
          
          <!-- Single Line Input -->
          <div *ngIf="!multiline" class="preview-input mb-3">
            <input 
              pInputText
              [placeholder]="placeholder || defaultPlaceholder"
              class="w-full"
              [attr.maxlength]="maxLength"
              [(ngModel)]="previewText"
              disabled
            />
          </div>

          <!-- Multi-line Input -->
          <div *ngIf="multiline" class="preview-input mb-3">
            <textarea 
              pInputTextarea
              [placeholder]="placeholder || defaultPlaceholder"
              class="w-full"
              rows="3"
              [attr.maxlength]="maxLength"
              [(ngModel)]="previewText"
              disabled
            ></textarea>
          </div>

          <!-- Character Counter (if limit is set) -->
          <div *ngIf="maxLength" class="character-counter text-right">
            <small class="text-500">
              {{ previewText.length }}/{{ maxLength }} characters
            </small>
          </div>
          
          <small class="block text-400 mt-3">
            This is how the text input will appear to users
          </small>
        </div>
      </p-panel>

      <!-- Input Type Information -->
      <div class="input-info mt-3 p-3 border-1 border-primary-200 bg-primary-50 border-round">
        <div class="flex align-items-center gap-2 mb-2">
          <i class="pi pi-info-circle text-primary"></i>
          <span class="font-medium text-primary">Input Configuration</span>
        </div>
        <div class="text-sm">
          <div class="flex justify-content-between mb-1">
            <span>Type:</span>
            <strong>{{ multiline ? 'Multi-line textarea' : 'Single-line input' }}</strong>
          </div>
          <div class="flex justify-content-between mb-1">
            <span>Character limit:</span>
            <strong>{{ maxLength || 'Unlimited' }}</strong>
          </div>
          <div class="flex justify-content-between">
            <span>Placeholder:</span>
            <strong>{{ placeholder || 'None' }}</strong>
          </div>
        </div>
      </div>

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
    .text-config {
      .recommendations {
        border-left: 3px solid var(--primary-color);
      }
      
      .preview-input {
        position: relative;
      }
      
      .character-counter {
        font-family: monospace;
      }
      
      .input-info {
        font-size: 0.875rem;
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
        
        .preview-input .p-inputtext,
        .preview-input .p-textarea {
          background-color: var(--surface-100);
          cursor: not-allowed;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextConfigComponent {
  @Input() placeholder = '';
  @Input() maxLength?: number;
  @Input() multiline = false;

  @Output() configChange = new EventEmitter<TextConfig>();

  previewText = '';
  defaultPlaceholder = 'Enter your response...';

  onConfigChange(): void {
    // Validate maxLength
    if (this.maxLength !== undefined) {
      if (this.maxLength < 1) this.maxLength = 1;
      if (this.maxLength > 2000) this.maxLength = 2000;
    }

    // Validate placeholder length
    if (this.placeholder && this.placeholder.length > 200) {
      this.placeholder = this.placeholder.substring(0, 200);
    }

    // Update preview text if it exceeds new limit
    if (this.maxLength && this.previewText.length > this.maxLength) {
      this.previewText = this.previewText.substring(0, this.maxLength);
    }

    this.configChange.emit({
      placeholder: this.placeholder || undefined,
      maxLength: this.maxLength,
      multiline: this.multiline
    });
  }

  // Validation methods
  isValid(): boolean {
    return this.getValidationErrors().length === 0;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    if (this.placeholder && this.placeholder.length > 200) {
      errors.push('Placeholder text must be under 200 characters');
    }

    if (this.maxLength !== undefined) {
      if (this.maxLength < 1) {
        errors.push('Character limit must be at least 1');
      }
      if (this.maxLength > 2000) {
        errors.push('Character limit cannot exceed 2000 characters');
      }
    }

    return errors;
  }

  // Preset configurations for common use cases
  applyPreset(preset: 'name' | 'email' | 'short' | 'comment' | 'essay'): void {
    switch (preset) {
      case 'name':
        this.placeholder = 'Enter your name';
        this.maxLength = 50;
        this.multiline = false;
        break;
      
      case 'email':
        this.placeholder = 'Enter your email address';
        this.maxLength = 100;
        this.multiline = false;
        break;
      
      case 'short':
        this.placeholder = 'Enter a brief response';
        this.maxLength = 100;
        this.multiline = false;
        break;
      
      case 'comment':
        this.placeholder = 'Share your thoughts or comments...';
        this.maxLength = 500;
        this.multiline = true;
        break;
      
      case 'essay':
        this.placeholder = 'Provide a detailed response...';
        this.maxLength = 1500;
        this.multiline = true;
        break;
    }
    
    this.onConfigChange();
  }

  // Helper methods for recommendations
  getRecommendationForLength(length: number): string {
    if (length <= 50) return 'Good for names, titles, or short answers';
    if (length <= 100) return 'Suitable for brief responses or identifiers';
    if (length <= 250) return 'Good for short paragraphs or explanations';
    if (length <= 500) return 'Suitable for comments or feedback';
    if (length <= 1000) return 'Good for detailed responses';
    return 'Suitable for essays or comprehensive answers';
  }

  // Character counting utilities
  getCharacterCountClass(): string {
    if (!this.maxLength) return '';
    
    const percentage = (this.previewText.length / this.maxLength) * 100;
    
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-orange-500';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-500';
  }

  getRemainingCharacters(): number {
    if (!this.maxLength) return Infinity;
    return Math.max(0, this.maxLength - this.previewText.length);
  }
}