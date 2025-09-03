// Core Brunch API Types
export interface Brunch {
  id: string;
  name: string;
  description?: string;
  adminPassword: string;
  votingPassword?: string;
  questions: Question[];
  hasVotingPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

// Question Types
export type QuestionType = 'single_choice' | 'multiple_choice' | 'rating' | 'text';

export interface BaseQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single_choice';
  options: string[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
  minChoices?: number;
  maxChoices?: number;
}

export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  minRating: number;
  maxRating: number;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
  maxLength?: number;
}

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | RatingQuestion | TextQuestion;

// API Request Types
export interface BrunchCreateRequest {
  name: string;
  description?: string;
  adminPassword: string;
  votingPassword?: string;
  questions: Omit<Question, 'id'>[];
}

export interface BrunchUpdateRequest {
  name?: string;
  description?: string;
  adminPassword?: string;
  votingPassword?: string;
}

export interface BrunchVoteRequest {
  voterName: string;
  voterEmail: string;
  answers: Record<string, unknown>;
}

// API Response Types
export interface BrunchInfo {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
  hasVotingPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrunchResults {
  brunchId: string;
  totalVotes: number;
  questionResults: Record<string, QuestionResult>;
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  totalResponses: number;
  results: unknown; // Will vary based on question type
}

// Form Models for UI
export interface BrunchFormModel {
  name: string;
  description?: string;
  adminPassword: string;
  votingPassword?: string;
  hasVotingPassword: boolean;
  questions: QuestionFormModel[];
}

export interface QuestionFormModel {
  tempId: string; // Temporary ID for UI management
  text: string;
  type: QuestionType;
  required: boolean;
  config: QuestionConfigModel;
}

export interface QuestionConfigModel {
  // Single/Multiple Choice
  options?: string[];
  minChoices?: number;
  maxChoices?: number;
  
  // Rating
  minRating?: number;
  maxRating?: number;
  labels?: {
    min?: string;
    max?: string;
  };
  
  // Text
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}

// Error and Validation Types
export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Question Type Options for Dropdowns
export interface QuestionTypeOption {
  label: string;
  value: QuestionType;
  icon: string;
  description: string;
}

export const QUESTION_TYPE_OPTIONS: QuestionTypeOption[] = [
  {
    label: 'Single Choice',
    value: 'single_choice',
    icon: 'pi pi-circle',
    description: 'Select one option from a list'
  },
  {
    label: 'Multiple Choice',
    value: 'multiple_choice',
    icon: 'pi pi-check-square',
    description: 'Select multiple options from a list'
  },
  {
    label: 'Rating',
    value: 'rating',
    icon: 'pi pi-star',
    description: 'Rate on a numerical scale'
  },
  {
    label: 'Text Response',
    value: 'text',
    icon: 'pi pi-pencil',
    description: 'Free-form text input'
  }
];

// WebSocket Message Types (Enhanced)
export interface EnhancedTableMessage {
  type: 'JOIN' | 'LEAVE' | 'UPDATE' | 'QUESTION_UPDATE' | 'BRUNCH_UPDATE';
  user: string | null;
  brunchId: string;
  questionId?: string;
  answer?: unknown;
  timestamp: string;
  data?: unknown;
}