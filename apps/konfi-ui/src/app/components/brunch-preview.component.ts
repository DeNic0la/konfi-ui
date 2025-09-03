import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { RatingModule } from 'primeng/rating';
import { PanelModule } from 'primeng/panel';

import { QuestionFormModel } from '../types/api.types';

interface BrunchPreviewData {
  name: string;
  description?: string;
  questions: QuestionFormModel[];
  hasVotingPassword: boolean;
  requireEmail: boolean;
}

@Component({
  selector: 'app-brunch-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
    CheckboxModule,
    RatingModule,
    PanelModule
  ],
  template: `
    <div class="brunch-preview">
      <!-- Preview Controls -->
      <div class="flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="m-0 mb-1">Preview</h3>
          <small class="text-600">See how your survey will appear to users</small>
        </div>
        <div class="preview-controls flex gap-2">
          <p-button 
            label="Mobile"
            icon="pi pi-mobile"
            [outlined]="previewMode !== 'mobile'"
            [severity]="previewMode === 'mobile' ? 'primary' : 'secondary'"
            size="small"
            (onClick)="setPreviewMode('mobile')"
          />
          <p-button 
            label="Desktop"
            icon="pi pi-desktop"
            [outlined]="previewMode !== 'desktop'"
            [severity]="previewMode === 'desktop' ? 'primary' : 'secondary'"
            size="small"
            (onClick)="setPreviewMode('desktop')"
          />
        </div>
      </div>

      <!-- Preview Container -->
      <div class="preview-container" [class]="'preview-' + previewMode">
        <p-card class="preview-card">
          <div class="survey-preview">
            <!-- Survey Header -->
            <div class="survey-header text-center mb-4">
              <h2 class="survey-title">{{ brunchConfig.name || 'Untitled Survey' }}</h2>
              <p *ngIf="brunchConfig.description" class="survey-description text-600 mt-2">
                {{ brunchConfig.description }}
              </p>
            </div>

            <!-- Security Notice -->
            <div *ngIf="brunchConfig.hasVotingPassword" class="security-notice mb-4 p-3 bg-primary-50 border-primary-200 border-1 border-round">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-lock text-primary"></i>
                <span class="text-primary font-medium">This survey requires a password to participate</span>
              </div>
            </div>

            <!-- Questions Preview -->
            <div class="questions-section">
              <div 
                *ngFor="let question of brunchConfig.questions; let i = index; trackBy: trackByTempId"
                class="question-preview mb-4"
              >
                <div class="question-header mb-3">
                  <label class="block font-medium text-900">
                    {{ i + 1 }}. {{ question.text || 'Untitled Question' }}
                    <span *ngIf="question.required" class="required-star text-red-500 ml-1">*</span>
                  </label>
                </div>

                <div class="question-input" [ngSwitch]="question.type">
                  
                  <!-- Single Choice Preview -->
                  <div *ngSwitchCase="'single_choice'" class="single-choice-preview">
                    <div 
                      *ngFor="let option of question.config.options; let j = index; trackBy: trackByIndex" 
                      class="field-radiobutton mb-2"
                    >
                      <p-radioButton 
                        [inputId]="'preview_single_' + question.tempId + '_' + j"
                        [name]="'preview_single_' + question.tempId"
                        [value]="option"
                        [disabled]="true"
                      />
                      <label [for]="'preview_single_' + question.tempId + '_' + j" class="ml-2">
                        {{ option }}
                      </label>
                    </div>
                  </div>

                  <!-- Multiple Choice Preview -->
                  <div *ngSwitchCase="'multiple_choice'" class="multiple-choice-preview">
                    <div 
                      *ngFor="let option of question.config.options; let j = index; trackBy: trackByIndex" 
                      class="field-checkbox mb-2"
                    >
                      <p-checkbox 
                        [inputId]="'preview_multi_' + question.tempId + '_' + j"
                        [value]="option"
                        [disabled]="true"
                      />
                      <label [for]="'preview_multi_' + question.tempId + '_' + j" class="ml-2">
                        {{ option }}
                      </label>
                    </div>
                    <small *ngIf="hasSelectionConstraints(question)" class="text-600 block mt-2">
                      {{ getSelectionConstraintsText(question) }}
                    </small>
                  </div>

                  <!-- Rating Preview -->
                  <div *ngSwitchCase="'rating'" class="rating-preview">
                    <div class="rating-container">
                      <p-rating 
                        [stars]="getRatingRange(question)"
                        [disabled]="true"
                        class="custom-rating"
                      />
                    </div>
                    <div *ngIf="hasRatingLabels(question)" class="rating-labels flex justify-content-between text-sm text-600 mt-2">
                      <span>{{ question.config.labels?.min || question.config.minRating }}</span>
                      <span>{{ question.config.labels?.max || question.config.maxRating }}</span>
                    </div>
                    <small class="text-600 block mt-1">
                      Scale: {{ question.config.minRating || 1 }} to {{ question.config.maxRating || 5 }}
                    </small>
                  </div>

                  <!-- Text Preview -->
                  <div *ngSwitchCase="'text'" class="text-preview">
                    <input 
                      pInputText
                      *ngIf="!question.config.multiline; else textareaPreview"
                      [placeholder]="question.config.placeholder || 'Enter your response...'"
                      class="w-full"
                      [attr.maxlength]="question.config.maxLength"
                      [disabled]="true"
                    />
                    <ng-template #textareaPreview>
                      <textarea 
                        pInputTextarea
                        [placeholder]="question.config.placeholder || 'Enter your response...'"
                        rows="3"
                        class="w-full"
                        [attr.maxlength]="question.config.maxLength"
                        [disabled]="true"
                      ></textarea>
                    </ng-template>
                    <small *ngIf="question.config.maxLength" class="text-600 block mt-1">
                      Maximum {{ question.config.maxLength }} characters
                    </small>
                  </div>
                  
                </div>
              </div>
            </div>

            <!-- Submit Section -->
            <div class="submit-section text-center mt-5 pt-4 border-top-1 surface-border">
              <p-button 
                label="Submit Response"
                icon="pi pi-check"
                severity="success"
                size="large"
                [disabled]="true"
              />
            </div>
            
            <!-- Preview Notice -->
            <div class="preview-notice text-center mt-4">
              <small class="text-500">
                <i class="pi pi-info-circle mr-1"></i>
                This is a preview - form interactions are disabled
              </small>
            </div>
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .brunch-preview {
      .preview-container {
        transition: all 0.3s ease;
        
        &.preview-mobile {
          max-width: 400px;
          margin: 0 auto;
          
          .preview-card {
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 12px;
          }
        }
        
        &.preview-desktop {
          max-width: 100%;
        }
      }
      
      .survey-preview {
        .survey-title {
          color: var(--text-color);
          font-size: 1.75rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }
        
        .survey-description {
          font-size: 1rem;
          line-height: 1.5;
          margin: 0;
        }
        
        .question-preview {
          padding: 1rem 0;
          
          .question-header {
            .required-star {
              font-size: 0.875rem;
            }
          }
          
          .question-input {
            .field-radiobutton,
            .field-checkbox {
              display: flex;
              align-items: center;
            }
            
            .rating-container {
              display: flex;
              justify-content: center;
              margin: 1rem 0;
              
              ::ng-deep .p-rating {
                .p-rating-icon {
                  font-size: 1.25rem;
                  color: var(--text-color-secondary);
                }
              }
            }
            
            .rating-labels {
              max-width: 300px;
              margin: 0 auto;
            }
          }
        }
        
        .submit-section {
          ::ng-deep .p-button {
            min-width: 200px;
          }
        }
        
        .preview-notice {
          opacity: 0.7;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrunchPreviewComponent {
  @Input() brunchConfig: BrunchPreviewData = {
    name: '',
    questions: [],
    hasVotingPassword: false,
    requireEmail: false
  };
  
  @Input() previewMode: 'mobile' | 'desktop' = 'desktop';
  @Output() previewModeChange = new EventEmitter<'mobile' | 'desktop'>();

  setPreviewMode(mode: 'mobile' | 'desktop'): void {
    this.previewMode = mode;
    this.previewModeChange.emit(mode);
  }

  // Tracking functions
  trackByTempId(index: number, question: QuestionFormModel): string {
    return question.tempId;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByType(index: number, item: any): string {
    return item.type;
  }

  // Question helper methods
  hasSelectionConstraints(question: QuestionFormModel): boolean {
    return !!(question.config.minChoices || question.config.maxChoices);
  }

  getSelectionConstraintsText(question: QuestionFormModel): string {
    const min = question.config.minChoices;
    const max = question.config.maxChoices;
    
    if (min && max) {
      return `Select ${min}-${max} options`;
    } else if (min) {
      return `Select at least ${min} option${min > 1 ? 's' : ''}`;
    } else if (max) {
      return `Select up to ${max} option${max > 1 ? 's' : ''}`;
    }
    
    return '';
  }

  getRatingRange(question: QuestionFormModel): number {
    const min = question.config.minRating || 1;
    const max = question.config.maxRating || 5;
    return max - min + 1;
  }

  hasRatingLabels(question: QuestionFormModel): boolean {
    return !!(question.config.labels?.min || question.config.labels?.max);
  }

  // Summary statistics
  getRequiredCount(): number {
    return this.brunchConfig.questions.filter(q => q.required).length;
  }

  getEstimatedTime(): string {
    const questionCount = this.brunchConfig.questions.length;
    const estimatedMinutes = Math.max(1, Math.ceil(questionCount * 0.5)); // ~30 seconds per question
    return `${estimatedMinutes} min${estimatedMinutes > 1 ? 's' : ''}`;
  }
}