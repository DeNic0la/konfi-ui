import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation,
  OnDestroy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormArray,
} from '@angular/forms';
import {
  debounceTime,
  filter,
  map,
  Subscription,
} from 'rxjs';
import { KeyFilter } from 'primeng/keyfilter';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Checkbox } from 'primeng/checkbox';
import { Panel } from 'primeng/panel';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { BrunchApiService } from '../services/brunch-api.service';
import { QuestionManagementService } from '../services/question-management.service';
import { AuthService } from '../services/auth.service';
import { 
  BrunchFormModel, 
  QuestionFormModel, 
  BrunchCreateRequest,
  QUESTION_TYPE_OPTIONS
} from '../types/api.types';
import { BrunchFormModelSchema } from '../zod/api.schemas';
import { QuestionManagementComponent } from '../components/question-management.component';
import { BrunchPreviewComponent } from '../components/brunch-preview.component';

@Component({
  selector: 'app-brunch-create',
  imports: [
    CommonModule,
    Card,
    FormsModule,
    ReactiveFormsModule,
    KeyFilter,
    Password,
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Checkbox,
    Panel,
    InputText,
    Textarea,
    QuestionManagementComponent,
    BrunchPreviewComponent,
  ],
  templateUrl: './brunch-create.component.html',
  styles: `
    /* Custom Tabs Styles */
    .custom-tabs :host ::ng-deep {
      .p-tablist {
        background: transparent;
        border-bottom: 1px solid var(--surface-border);
      }
      
      .p-tab {
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        color: var(--text-color-secondary);
        padding: 1rem 1.5rem;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      
      .p-tab.p-tab-active {
        border-bottom-color: var(--primary-color);
        color: var(--primary-color);
        background: transparent;
      }
      
      .p-tab:not(.p-tab-active):not(.p-disabled):hover {
        color: var(--text-color);
        background: var(--surface-hover);
      }
      
      .p-tabpanels {
        background: transparent;
        padding: 1.5rem 0;
      }
    }
    
    .tab-content {
      min-height: 400px;
    }
    
    .preview-sidebar {
      max-height: 80vh;
    }
    
    .sticky-top {
      position: sticky;
      top: 1rem;
    }
    
    .preview-card {
      border: 1px solid var(--surface-border);
    }
    
    .quick-preview-content {
      .stat-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        
        .stat-label {
          color: var(--text-color-secondary);
          font-size: 0.875rem;
        }
        
        .stat-value {
          font-weight: 600;
          color: var(--text-color);
        }
      }
    }
    
    .form-actions {
      border-top: 1px solid var(--surface-border);
      padding-top: 1.5rem;
    }
    
    .tab-navigation {
      min-width: 80px;
    }
    
    /* Form Field Styling */
    .form-field {
      margin-bottom: 1rem;
    }
    
    .form-field label {
      font-weight: 500;
      color: var(--text-color);
    }
    
    /* Responsive adjustments */
    @media (max-width: 1024px) {
      .preview-sidebar {
        display: none;
      }
    }
    
    @media (max-width: 768px) {
      .custom-tabview :host ::ng-deep {
        .p-tabview-nav li .p-tabview-nav-link {
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
        }
      }
    }

    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .brunch-create-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 0;
    }

    .brunch-create-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;
    }

    .brunch-create-title {
      font-size: 2.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .brunch-create-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }

    .brunch-create-content {
      animation: slideUp 0.6s ease-out;
    }

    .brunch-create-card {
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      border-radius: 16px;
      border: none;
      overflow: hidden;
    }

    .brunch-create-card .p-card-body {
      padding: 2rem;
    }

    /* Animations */
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      :host {
        padding: 0.5rem;
      }

      .brunch-create-container {
        padding: 1rem 0;
      }

      .brunch-create-title {
        font-size: 2rem;
      }

      .brunch-create-card .p-card-body {
        padding: 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .brunch-create-title {
        font-size: 1.8rem;
      }

      .brunch-create-card .p-card-body {
        padding: 1rem;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrunchCreateComponent implements OnInit, OnDestroy {
  private readonly brunchApiService = inject(BrunchApiService);
  private readonly questionManagementService = inject(QuestionManagementService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private sub: Subscription = new Subscription();
  
  // Form validation regex
  public readonly idRegexp = /^[a-zA-Z0-9-]+$/;
  
  // UI State
  public activeTabValue = 'basic';
  public isSubmitting = false;
  public previewMode: 'mobile' | 'desktop' = 'desktop';
  
  // Form Data
  public questions: QuestionFormModel[] = [];
  
  // Main brunch form
  public readonly brunchForm = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]),
    description: this.fb.control('', [Validators.maxLength(1000)]),
    id: this.fb.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z0-9-]+$/)
    ]),
    adminPassword: this.fb.control('', [Validators.required, Validators.minLength(1)]),
    votingPassword: this.fb.control(''),
    hasVotingPassword: this.fb.control(false),
    requireEmail: this.fb.control(false)
  });

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.initializeDefaultQuestion();
  }

  private setupFormSubscriptions(): void {
    // Auto-generate ID from name
    const nameToIdSubscription = this.brunchForm.get('name')!.valueChanges
      .pipe(
        filter((value): value is string => typeof value === 'string' && value?.trim()?.length > 0),
        debounceTime(300),
        map(name => this.brunchApiService.sanitizeBrunchId(name))
      )
      .subscribe(id => {
        this.brunchForm.get('id')?.patchValue(id, { emitEvent: false });
      });
    
    this.sub.add(nameToIdSubscription);

    // Clear voting password when hasVotingPassword is unchecked
    const votingPasswordToggleSubscription = this.brunchForm.get('hasVotingPassword')!.valueChanges
      .subscribe(hasPassword => {
        if (!hasPassword) {
          this.brunchForm.get('votingPassword')?.patchValue('');
        }
      });
    
    this.sub.add(votingPasswordToggleSubscription);
  }

  private initializeDefaultQuestion(): void {
    // Add a default rating question
    const defaultQuestion = this.questionManagementService.createEmptyQuestion('rating');
    defaultQuestion.text = 'How confident are you in this project?';
    defaultQuestion.config = {
      minRating: 1,
      maxRating: 5
    };
    this.questions = [defaultQuestion];
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.brunchForm.get(fieldName);
    return !!(field?.invalid && (field.touched || field.dirty));
  }

  canProceedToNextTab(): boolean {
    switch (this.activeTabValue) {
      case 'basic': // Basic Information
        return !!(this.brunchForm.get('name')?.valid && this.brunchForm.get('id')?.valid);
      case 'security': // Security Settings
        return !!(this.brunchForm.get('adminPassword')?.valid);
      case 'questions': // Questions
        return this.questions.length > 0 && this.questions.every(q => 
          this.questionManagementService.validateQuestion(q).success
        );
      case 'preview': // Preview
        return true;
      default:
        return false;
    }
  }

  // Tab navigation
  nextTab(): void {
    const tabs = ['basic', 'security', 'questions', 'preview'];
    const currentIndex = tabs.indexOf(this.activeTabValue);
    if (currentIndex < tabs.length - 1 && this.canProceedToNextTab()) {
      this.activeTabValue = tabs[currentIndex + 1];
    }
  }

  previousTab(): void {
    const tabs = ['basic', 'security', 'questions', 'preview'];
    const currentIndex = tabs.indexOf(this.activeTabValue);
    if (currentIndex > 0) {
      this.activeTabValue = tabs[currentIndex - 1];
    }
  }

  goToPreviewTab(): void {
    this.activeTabValue = 'preview';
  }

  // Question management
  onQuestionsChange(questions: QuestionFormModel[]): void {
    this.questions = questions;
  }

  // Preview functionality
  getBrunchPreviewData() {
    return {
      name: this.brunchForm.get('name')?.value || 'Untitled Brunch',
      description: this.brunchForm.get('description')?.value || undefined,
      questions: this.questions,
      hasVotingPassword: !!this.brunchForm.get('hasVotingPassword')?.value,
      requireEmail: !!this.brunchForm.get('requireEmail')?.value
    };
  }

  onPreviewModeChange(mode: 'mobile' | 'desktop'): void {
    this.previewMode = mode;
  }

  getSecurityLevel(): string {
    const hasAdmin = !!this.brunchForm.get('adminPassword')?.value;
    const hasVoting = this.brunchForm.get('hasVotingPassword')?.value;
    
    if (hasAdmin && hasVoting) return 'High';
    if (hasAdmin) return 'Medium';
    return 'Basic';
  }

  // Import/Export functionality
  importQuestions(): void {
    // TODO: Implement question import
    console.log('Import questions functionality to be implemented');
  }

  exportQuestions(): void {
    if (this.questions.length > 0) {
      const exported = this.questionManagementService.exportQuestions(this.questions);
      this.downloadAsFile(exported, 'brunch-questions.json', 'application/json');
    }
  }

  private downloadAsFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Form submission
  onSubmit(): void {
    if (this.brunchForm.invalid) {
      this.markAllFieldsAsTouched();
      this.activeTabValue = 'basic'; // Go to first tab with errors
      return;
    }

    if (this.questions.length === 0) {
      this.activeTabValue = 'questions'; // Go to questions tab
      return;
    }

    // Validate all questions
    const questionsValidation = this.questionManagementService.validateQuestionList(this.questions);
    if (!questionsValidation.success) {
      this.activeTabValue = 'questions'; // Go to questions tab
      return;
    }

    this.isSubmitting = true;

    try {
      // Transform form data to API request
      const brunchRequest: BrunchCreateRequest = this.brunchApiService.transformFormToBrunchRequest({
        name: this.brunchForm.get('name')?.value,
        description: this.brunchForm.get('description')?.value,
        adminPassword: this.brunchForm.get('adminPassword')?.value,
        votingPassword: this.brunchForm.get('hasVotingPassword')?.value ? this.brunchForm.get('votingPassword')?.value : undefined,
        hasVotingPassword: this.brunchForm.get('hasVotingPassword')?.value,
        questions: this.questions
      });

      const createSubscription = this.brunchApiService.createBrunch(brunchRequest)
        .subscribe({
          next: (brunchInfo) => {
            console.log('Brunch created successfully:', brunchInfo);
            
            // Store admin password for future use
            this.authService.setAdminPassword(brunchInfo.id, brunchRequest.adminPassword);
            
            // Store voting password if provided
            if (brunchRequest.votingPassword) {
              this.authService.setVotingPassword(brunchInfo.id, brunchRequest.votingPassword);
            }
            
            this.isSubmitting = false;

            // Navigate to admin page
            this.router.navigate(['/table/admin', brunchInfo.id])
              .then(() => console.log('Navigated to admin page'))
              .catch(err => console.error('Navigation error:', err));
          },
          error: (error) => {
            console.error('Error creating brunch:', error);
            this.isSubmitting = false;
            // TODO: Show user-friendly error message
          }
        });

      this.sub.add(createSubscription);
    } catch (error) {
      console.error('Form validation error:', error);
      this.isSubmitting = false;
      // TODO: Show validation error to user
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.brunchForm.controls).forEach(key => {
      this.brunchForm.get(key)?.markAsTouched();
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}