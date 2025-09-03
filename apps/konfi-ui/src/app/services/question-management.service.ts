import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, AbstractControl } from '@angular/forms';
import { 
  QuestionType, 
  QuestionFormModel, 
  QuestionConfigModel,
  Question,
  ValidationResult
} from '../types/api.types';
import { QuestionFormModelSchema } from '../zod/api.schemas';

@Injectable({
  providedIn: 'root'
})
export class QuestionManagementService {

  // Question Creation and Management
  createEmptyQuestion(type: QuestionType = 'single_choice'): QuestionFormModel {
    return {
      tempId: this.generateTempId(),
      text: '',
      type,
      required: true,
      config: this.createDefaultConfig(type)
    };
  }

  duplicateQuestion(question: QuestionFormModel): QuestionFormModel {
    return {
      ...question,
      tempId: this.generateTempId(),
      text: `${question.text} (Copy)`
    };
  }

  // Question Type Management
  changeQuestionType(question: QuestionFormModel, newType: QuestionType): QuestionFormModel {
    return {
      ...question,
      type: newType,
      config: this.createDefaultConfig(newType)
    };
  }

  // Question Configuration
  createDefaultConfig(type: QuestionType): QuestionConfigModel {
    switch (type) {
      case 'single_choice':
        return {
          options: ['Option 1', 'Option 2']
        };
      
      case 'multiple_choice':
        return {
          options: ['Option 1', 'Option 2'],
          minChoices: 1,
          maxChoices: undefined
        };
      
      case 'rating':
        return {
          minRating: 1,
          maxRating: 5
        };
      
      case 'text':
        return {
          placeholder: 'Enter your response...',
          maxLength: undefined
        };
      
      default:
        return {};
    }
  }

  // Form Control Creation
  createQuestionFormGroup(question?: QuestionFormModel): FormGroup {
    const formQuestion = question || this.createEmptyQuestion();
    
    const formGroup = new FormGroup({
      tempId: new FormControl(formQuestion.tempId),
      text: new FormControl(formQuestion.text, [
        Validators.required,
        Validators.maxLength(500)
      ]),
      type: new FormControl(formQuestion.type, Validators.required),
      required: new FormControl(formQuestion.required),
      config: this.createConfigFormGroup(formQuestion.type, formQuestion.config)
    });

    // Watch for type changes to update config
    formGroup.get('type')?.valueChanges.subscribe(newType => {
      if (newType && newType !== formQuestion.type) {
        const configGroup = this.createConfigFormGroup(newType, this.createDefaultConfig(newType));
        formGroup.setControl('config', configGroup);
      }
    });

    return formGroup;
  }

  createConfigFormGroup(type: QuestionType, config: QuestionConfigModel): FormGroup {
    switch (type) {
      case 'single_choice':
        return new FormGroup({
          options: new FormArray(
            (config.options || ['Option 1', 'Option 2']).map(
              option => new FormControl(option, [Validators.required, Validators.maxLength(200)])
            ),
            [Validators.minLength(2), Validators.maxLength(10)]
          )
        });
      
      case 'multiple_choice':
        return new FormGroup({
          options: new FormArray(
            (config.options || ['Option 1', 'Option 2']).map(
              option => new FormControl(option, [Validators.required, Validators.maxLength(200)])
            ),
            [Validators.minLength(2), Validators.maxLength(10)]
          ),
          minChoices: new FormControl(config.minChoices, [
            Validators.min(0),
            Validators.pattern(/^\d+$/)
          ]),
          maxChoices: new FormControl(config.maxChoices, [
            Validators.min(1),
            Validators.pattern(/^\d+$/)
          ])
        });
      
      case 'rating':
        return new FormGroup({
          minRating: new FormControl(config.minRating || 1, [
            Validators.required,
            Validators.min(1),
            Validators.max(10),
            Validators.pattern(/^\d+$/)
          ]),
          maxRating: new FormControl(config.maxRating || 5, [
            Validators.required,
            Validators.min(2),
            Validators.max(10),
            Validators.pattern(/^\d+$/)
          ])
        }, [this.ratingRangeValidator]);
      
      case 'text':
        return new FormGroup({
          placeholder: new FormControl(config.placeholder || '', [
            Validators.maxLength(200)
          ]),
          maxLength: new FormControl(config.maxLength, [
            Validators.min(1),
            Validators.max(2000),
            Validators.pattern(/^\d+$/)
          ])
        });
      
      default:
        return new FormGroup({});
    }
  }

  // Custom Validators
  private ratingRangeValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const group = control as FormGroup;
    const min = group.get('minRating')?.value;
    const max = group.get('maxRating')?.value;
    
    if (min && max && min >= max) {
      return { invalidRange: true };
    }
    
    return null;
  }

  // Options Management for Choice Questions
  addOption(optionsFormArray: FormArray): void {
    const newIndex = optionsFormArray.length + 1;
    optionsFormArray.push(
      new FormControl(`Option ${newIndex}`, [
        Validators.required,
        Validators.maxLength(200)
      ])
    );
  }

  removeOption(optionsFormArray: FormArray, index: number): void {
    if (optionsFormArray.length > 2) {
      optionsFormArray.removeAt(index);
    }
  }

  moveOption(optionsFormArray: FormArray, fromIndex: number, toIndex: number): void {
    const option = optionsFormArray.at(fromIndex);
    optionsFormArray.removeAt(fromIndex);
    optionsFormArray.insert(toIndex, option);
  }

  // Validation
  validateQuestion(question: QuestionFormModel): ValidationResult<QuestionFormModel> {
    try {
      const validQuestion = QuestionFormModelSchema.parse(question);
      
      // Additional business logic validation can be added here
      
      return {
        success: true,
        data: validQuestion
      };
    } catch (error: any) {
      return {
        success: false,
        errors: error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        })) || [{ field: 'general', message: 'Validation failed', code: 'VALIDATION_ERROR' }]
      };
    }
  }

  validateQuestionList(questions: QuestionFormModel[]): ValidationResult<QuestionFormModel[]> {
    if (questions.length === 0) {
      return {
        success: false,
        errors: [{ field: 'questions', message: 'At least one question is required', code: 'MIN_QUESTIONS' }]
      };
    }

    if (questions.length > 50) {
      return {
        success: false,
        errors: [{ field: 'questions', message: 'Maximum 50 questions allowed', code: 'MAX_QUESTIONS' }]
      };
    }

    const errors: any[] = [];
    questions.forEach((question, index) => {
      const result = this.validateQuestion(question);
      if (!result.success) {
        result.errors?.forEach(error => {
          errors.push({
            ...error,
            field: `questions[${index}].${error.field}`
          });
        });
      }
    });

    return errors.length > 0 
      ? { success: false, errors }
      : { success: true, data: questions };
  }

  // Question Preview Helpers
  getQuestionPreviewData(question: QuestionFormModel): any {
    switch (question.type) {
      case 'single_choice':
      case 'multiple_choice':
        return {
          options: question.config.options || [],
          minChoices: question.config.minChoices,
          maxChoices: question.config.maxChoices
        };
      
      case 'rating':
        return {
          min: question.config.minRating || 1,
          max: question.config.maxRating || 5,
          range: (question.config.maxRating || 5) - (question.config.minRating || 1) + 1
        };
      
      case 'text':
        return {
          placeholder: question.config.placeholder || 'Enter your response...',
          maxLength: question.config.maxLength
        };
      
      default:
        return {};
    }
  }

  // Question Summary for Display
  getQuestionSummary(question: QuestionFormModel): string {
    if (!question.text) return 'Untitled Question';

    const typeInfo = this.getQuestionTypeInfo(question);
    return `${question.text} (${typeInfo})`;
  }

  getQuestionTypeInfo(question: QuestionFormModel): string {
    switch (question.type) {
      case 'single_choice':
        return `Single Choice - ${question.config.options?.length || 0} options`;
      
      case 'multiple_choice':
        const constraints = [];
        if (question.config.minChoices) constraints.push(`min: ${question.config.minChoices}`);
        if (question.config.maxChoices) constraints.push(`max: ${question.config.maxChoices}`);
        const constraintText = constraints.length > 0 ? ` (${constraints.join(', ')})` : '';
        return `Multiple Choice - ${question.config.options?.length || 0} options${constraintText}`;
      
      case 'rating':
        return `Rating Scale ${question.config.minRating || 1}-${question.config.maxRating || 5}`;
      
      case 'text':
        const maxLength = question.config.maxLength ? ` (max ${question.config.maxLength} chars)` : '';
        return `Text Response${maxLength}`;
      
      default:
        return 'Unknown Type';
    }
  }

  // Question Ordering
  moveQuestion(questions: QuestionFormModel[], fromIndex: number, toIndex: number): QuestionFormModel[] {
    const updatedQuestions = [...questions];
    const [movedQuestion] = updatedQuestions.splice(fromIndex, 1);
    updatedQuestions.splice(toIndex, 0, movedQuestion);
    return updatedQuestions;
  }

  // Utility Methods
  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Export/Import Helpers
  exportQuestions(questions: QuestionFormModel[]): string {
    return JSON.stringify(questions, null, 2);
  }

  importQuestions(jsonString: string): ValidationResult<QuestionFormModel[]> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return {
          success: false,
          errors: [{ field: 'root', message: 'Invalid format: expected an array', code: 'INVALID_FORMAT' }]
        };
      }
      
      // Regenerate temp IDs for imported questions
      const questions = parsed.map(q => ({
        ...q,
        tempId: this.generateTempId()
      }));
      
      return this.validateQuestionList(questions);
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'root', message: 'Invalid JSON format', code: 'INVALID_JSON' }]
      };
    }
  }
}