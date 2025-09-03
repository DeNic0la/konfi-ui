import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { QuestionFormModel, QuestionType, QUESTION_TYPE_OPTIONS } from '../types/api.types';
import { QuestionManagementService } from '../services/question-management.service';
import { ChoiceOptionsConfigComponent } from './question-config/choice-options-config.component';
import { RatingConfigComponent } from './question-config/rating-config.component';
import { TextConfigComponent } from './question-config/text-config.component';

@Component({
  selector: 'app-question-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AccordionModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    CheckboxModule,
    TagModule,
    ConfirmDialogModule,
    ChoiceOptionsConfigComponent,
    RatingConfigComponent,
    TextConfigComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <div class="question-management">
      <!-- Header -->
      <div class="flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="m-0 mb-1">Questions</h3>
          <small class="text-600">Design your survey questions with different input types</small>
        </div>
        <p-button
          label="Add Question"
          icon="pi pi-plus"
          (onClick)="addQuestion()"
          size="small"
          [disabled]="questions.length >= 50"
        />
      </div>

      <!-- Question List -->
      <p-accordion [multiple]="true" class="question-accordion">
        <p-accordion-panel
          *ngFor="let question of questions; trackBy: trackByTempId; let i = index"
        >
          <ng-template pTemplate="header">
            <div class="question-header w-full flex justify-content-between align-items-center">
              <div class="question-info flex align-items-center gap-3">
                <div class="question-number flex align-items-center justify-content-center">
                  <span class="font-semibold">{{ i + 1 }}</span>
                </div>
                <div>
                  <div class="question-title">
                    {{ question.text || 'Untitled Question' }}
                  </div>
                  <div class="question-meta flex align-items-center gap-2 mt-1">
                    <p-tag
                      [value]="getQuestionTypeLabel(question.type)"
                      severity="info"
                      class="text-xs"
                    />
                    <span *ngIf="question.required" class="required-badge">
                      <i class="pi pi-asterisk text-xs"></i>
                    </span>
                  </div>
                </div>
              </div>

              <div class="question-actions flex align-items-center gap-1" (click)="$event.stopPropagation()">
                <p-button
                  icon="pi pi-copy"
                  severity="secondary"
                  [text]="true"
                  size="small"
                  (onClick)="duplicateQuestion(i); $event.stopPropagation()"
                  pTooltip="Duplicate question"
                />
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  size="small"
                  (onClick)="confirmDeleteQuestion(i); $event.stopPropagation()"
                  [disabled]="questions.length <= 1"
                  pTooltip="Delete question"
                />
              </div>
            </div>
          </ng-template>

          <!-- Question Configuration Content -->
          <div class="question-config-content">
            <div class="grid">
              <!-- Question Title and Type -->
              <div class="col-12 lg:col-8">
                <div class="form-field">
                  <label class="block text-sm font-medium mb-2">Question Title *</label>
                  <input
                    pInputText
                    [(ngModel)]="question.text"
                    placeholder="Enter your question..."
                    class="w-full"
                    maxlength="500"
                    (input)="onQuestionChange()"
                  />
                  <small class="text-xs text-500 block mt-1">
                    {{ question.text.length }}/500 characters
                  </small>
                </div>
              </div>

              <div class="col-12 lg:col-4">
                <div class="form-field">
                  <label class="block text-sm font-medium mb-2">Question Type</label>
                  <p-select
                    [options]="questionTypeOptions"
                    [(ngModel)]="question.type"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select type"
                    class="w-full"
                    (onChange)="onQuestionTypeChange(question)"
                  >
                    <ng-template pTemplate="selectedItem" let-option>
                      <div *ngIf="option" class="flex align-items-center gap-2">
                        <i [class]="option.icon" class="text-sm"></i>
                        <span>{{ option.label }}</span>
                      </div>
                    </ng-template>
                    <ng-template pTemplate="item" let-option>
                      <div class="flex align-items-center gap-2 p-2">
                        <i [class]="option.icon" class="text-sm"></i>
                        <div>
                          <div>{{ option.label }}</div>
                          <small class="text-600">{{ option.description }}</small>
                        </div>
                      </div>
                    </ng-template>
                  </p-select>
                </div>
              </div>

              <!-- Required Toggle -->
              <div class="col-12">
                <div class="flex align-items-center gap-2">
                  <p-checkbox
                    [(ngModel)]="question.required"
                    binary="true"
                    inputId="required_{{question.tempId}}"
                    (onChange)="onQuestionChange()"
                  />
                  <label for="required_{{question.tempId}}" class="text-sm">
                    Required question
                  </label>
                </div>
                <small class="text-xs text-500 block mt-1">
                  Users must answer this question to submit their response
                </small>
              </div>
            </div>

            <!-- Dynamic Configuration Panel -->
            <div class="question-type-config mt-4">
              <div [ngSwitch]="question.type">
                <!-- Single Choice Configuration -->
                <app-choice-options-config
                  *ngSwitchCase="'single_choice'"
                  [options]="question.config.options || []"
                  [allowOther]="false"
                  [showConstraints]="false"
                  (optionsChange)="updateQuestionConfig(question, 'options', $event)"
                />

                <!-- Multiple Choice Configuration -->
                <app-choice-options-config
                  *ngSwitchCase="'multiple_choice'"
                  [options]="question.config.options || []"
                  [minChoices]="question.config.minChoices"
                  [maxChoices]="question.config.maxChoices"
                  [allowOther]="false"
                  [showConstraints]="true"
                  (optionsChange)="updateQuestionConfig(question, 'options', $event)"
                  (constraintsChange)="updateQuestionConstraints(question, $event)"
                />

                <!-- Rating Configuration -->
                <app-rating-config
                  *ngSwitchCase="'rating'"
                  [minRating]="question.config.minRating || 1"
                  [maxRating]="question.config.maxRating || 5"
                  [labels]="{ min: question.config.labels?.min || '', max: question.config.labels?.max || '' }"
                  (configChange)="updateQuestionConfig(question, null, $event)"
                />

                <!-- Text Configuration -->
                <app-text-config
                  *ngSwitchCase="'text'"
                  [placeholder]="question.config.placeholder || ''"
                  [maxLength]="question.config.maxLength"
                  [multiline]="question.config.multiline || false"
                  (configChange)="updateQuestionConfig(question, null, $event)"
                />
              </div>
            </div>
          </div>
        </p-accordion-panel>
      </p-accordion>

      <!-- Empty State -->
      <div *ngIf="questions.length === 0" class="text-center p-6 border-2 border-dashed surface-border border-round">
        <i class="pi pi-inbox text-6xl text-400 mb-4"></i>
        <h4 class="text-700 mb-2">No questions added yet</h4>
        <p class="text-600 mb-4">Start by adding your first question to create your survey</p>
        <p-button
          label="Add First Question"
          icon="pi pi-plus"
          (onClick)="addQuestion()"
        />
      </div>

      <!-- Question Summary -->
      <div *ngIf="questions.length > 0" class="question-summary mt-4 p-3 surface-100 border-round">
        <div class="flex justify-content-between align-items-center">
          <div class="summary-stats">
            <span class="font-medium">{{ questions.length }} question{{ questions.length !== 1 ? 's' : '' }}</span>
            <span class="text-600 mx-2">•</span>
            <span class="text-600">{{ getRequiredQuestionsCount() }} required</span>
          </div>
          <div class="summary-types">
            <span
              *ngFor="let type of getUniqueQuestionTypes(); trackBy: trackByString"
              class="type-chip"
            >
              <i [class]="getQuestionTypeIcon(type)" class="mr-1"></i>
              {{ getQuestionTypeCount(type) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <p-confirmDialog />
  `,
  styles: [`
    .question-management {
      .question-accordion ::ng-deep {
        .p-accordion-tab {
          margin-bottom: 0.75rem;
        }

        .p-accordion-header {
          border-radius: 8px;
          border: 1px solid var(--surface-border);
        }

        .p-accordion-header-link {
          padding: 1rem 1.5rem;
          border-radius: 8px;
        }

        .p-accordion-content {
          border-radius: 0 0 8px 8px;
          border: 1px solid var(--surface-border);
          border-top: none;
          padding: 1.5rem;
        }
      }

      .question-header {
        .question-number {
          width: 2rem;
          height: 2rem;
          background: var(--primary-color);
          color: white;
          border-radius: 50%;
          font-size: 0.875rem;
        }

        .question-title {
          font-weight: 500;
          color: var(--text-color);
        }

        .question-meta {
          .required-badge {
            color: var(--red-500);
          }
        }

        .question-actions {
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
      }

      .question-header:hover .question-actions {
        opacity: 1;
      }

      .question-type-config {
        border-top: 1px solid var(--surface-border);
        padding-top: 1.5rem;
      }

      .question-summary {
        .summary-types {
          .type-chip {
            background: var(--surface-200);
            color: var(--text-color-secondary);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            margin-left: 0.5rem;
          }
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionManagementComponent implements OnInit, OnDestroy {
  @Input() questions: QuestionFormModel[] = [];
  @Output() questionsChange = new EventEmitter<QuestionFormModel[]>();

  private readonly questionManagementService = inject(QuestionManagementService);
  private readonly confirmationService = inject(ConfirmationService);
  private destroy$ = new Subject<void>();

  editingQuestionIndex = -1;
  questionTypeOptions = QUESTION_TYPE_OPTIONS;

  ngOnInit(): void {
    // Initialize with at least one question if empty
    if (this.questions.length === 0) {
      this.addQuestion();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Question Management
  addQuestion(): void {
    if (this.questions.length < 50) {
      const newQuestion = this.questionManagementService.createEmptyQuestion('single_choice');
      this.questions = [...this.questions, newQuestion];
      this.editingQuestionIndex = this.questions.length - 1;
      this.emitChange();
    }
  }

  duplicateQuestion(index: number): void {
    if (this.questions.length < 50) {
      const duplicated = this.questionManagementService.duplicateQuestion(this.questions[index]);
      this.questions = [
        ...this.questions.slice(0, index + 1),
        duplicated,
        ...this.questions.slice(index + 1)
      ];
      this.emitChange();
    }
  }

  confirmDeleteQuestion(index: number): void {
    if (this.questions.length <= 1) return;

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this question?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteQuestion(index)
    });
  }

  private deleteQuestion(index: number): void {
    this.questions = this.questions.filter((_, i) => i !== index);
    if (this.editingQuestionIndex >= this.questions.length) {
      this.editingQuestionIndex = this.questions.length - 1;
    }
    this.emitChange();
  }

  // Question Configuration
  onQuestionTypeChange(question: QuestionFormModel): void {
    const updatedQuestion = this.questionManagementService.changeQuestionType(question, question.type);
    const index = this.questions.findIndex(q => q.tempId === question.tempId);
    if (index >= 0) {
      this.questions[index] = updatedQuestion;
      this.emitChange();
    }
  }

  onQuestionChange(): void {
    this.emitChange();
  }

  updateQuestionConfig(question: QuestionFormModel, key: string | null, value: any): void {
    const index = this.questions.findIndex(q => q.tempId === question.tempId);
    if (index >= 0) {
      if (key) {
        this.questions[index].config = {
          ...this.questions[index].config,
          [key]: value
        };
      } else {
        this.questions[index].config = {
          ...this.questions[index].config,
          ...value
        };
      }
      this.emitChange();
    }
  }

  updateQuestionConstraints(question: QuestionFormModel, constraints: { minChoices?: number; maxChoices?: number }): void {
    this.updateQuestionConfig(question, null, constraints);
  }

  // Helper Methods
  trackByTempId(index: number, question: QuestionFormModel): string {
    return question.tempId;
  }

  trackByString(index: number, item: string): string {
    return item;
  }

  getQuestionTypeLabel(type: QuestionType): string {
    return QUESTION_TYPE_OPTIONS.find(option => option.value === type)?.label || type;
  }

  getQuestionTypeIcon(type: QuestionType): string {
    return QUESTION_TYPE_OPTIONS.find(option => option.value === type)?.icon || 'pi pi-question';
  }

  getRequiredQuestionsCount(): number {
    return this.questions.filter(q => q.required).length;
  }

  getUniqueQuestionTypes(): QuestionType[] {
    const types = this.questions.map(q => q.type);
    return [...new Set(types)];
  }

  getQuestionTypeCount(type: QuestionType): number {
    return this.questions.filter(q => q.type === type).length;
  }

  private emitChange(): void {
    this.questionsChange.emit([...this.questions]);
  }

  // Validation helpers
  isQuestionValid(question: QuestionFormModel): boolean {
    return this.questionManagementService.validateQuestion(question).success;
  }

  getQuestionErrors(question: QuestionFormModel): string[] {
    const validation = this.questionManagementService.validateQuestion(question);
    return validation.errors?.map(e => e.message) || [];
  }
}
