import { z } from 'zod';
import type { QuestionType } from '../types/api.types';

// Base Question Schema
export const BaseQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(500),
  type: z.enum(['single_choice', 'multiple_choice', 'rating', 'text'] as const),
  required: z.boolean().default(true),
});

// Question Type Schemas
export const SingleChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('single_choice'),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
});

export const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('multiple_choice'),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
  minChoices: z.number().int().min(0).optional(),
  maxChoices: z.number().int().min(1).optional(),
}).refine(
  (data) => {
    if (data.minChoices !== undefined && data.maxChoices !== undefined) {
      return data.minChoices <= data.maxChoices;
    }
    return true;
  },
  {
    message: "minChoices must be less than or equal to maxChoices",
    path: ["maxChoices"],
  }
).refine(
  (data) => {
    if (data.maxChoices !== undefined) {
      return data.maxChoices <= data.options.length;
    }
    return true;
  },
  {
    message: "maxChoices cannot exceed number of options",
    path: ["maxChoices"],
  }
);

export const RatingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('rating'),
  minRating: z.number().int().min(1).max(10).default(1),
  maxRating: z.number().int().min(2).max(10).default(5),
}).refine(
  (data) => data.maxRating > data.minRating,
  {
    message: "maxRating must be greater than minRating",
    path: ["maxRating"],
  }
);

export const TextQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('text'),
  placeholder: z.string().max(200).optional(),
  maxLength: z.number().int().min(1).max(2000).optional(),
});

// Union Question Schema
export const QuestionSchema = z.union([
  SingleChoiceQuestionSchema,
  MultipleChoiceQuestionSchema,
  RatingQuestionSchema,
  TextQuestionSchema,
]);

// Brunch Schemas
export const BrunchCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  adminPassword: z.string().min(1),
  votingPassword: z.string().min(1).optional(),
  questions: z.array(z.object({
    text: z.string().min(1).max(500),
    type: z.enum(['single_choice', 'multiple_choice', 'rating', 'text'] as const),
    required: z.boolean().default(true),
    options: z.array(z.string()).optional(),
    minChoices: z.number().int().min(0).optional(),
    maxChoices: z.number().int().min(1).optional(),
    minRating: z.number().int().min(1).max(10).optional(),
    maxRating: z.number().int().min(2).max(10).optional(),
    placeholder: z.string().max(200).optional(),
    maxLength: z.number().int().min(1).max(2000).optional(),
  })).min(1).max(50),
});

export const BrunchUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  adminPassword: z.string().min(1).optional(),
  votingPassword: z.string().min(1).optional(),
});

export const BrunchInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(QuestionSchema),
  hasVotingPassword: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const BrunchVoteRequestSchema = z.object({
  voterName: z.string().min(1).max(100),
  voterEmail: z.string().email(),
  answers: z.record(z.string(), z.unknown()),
});

// Form Model Schemas for UI Validation
export const QuestionConfigModelSchema = z.object({
  // Single/Multiple Choice
  options: z.array(z.string().min(1)).optional(),
  minChoices: z.number().int().min(0).optional(),
  maxChoices: z.number().int().min(1).optional(),
  
  // Rating
  minRating: z.number().int().min(1).max(10).optional(),
  maxRating: z.number().int().min(2).max(10).optional(),
  labels: z.object({
    min: z.string().optional(),
    max: z.string().optional()
  }).optional(),
  
  // Text
  placeholder: z.string().max(200).optional(),
  maxLength: z.number().int().min(1).max(2000).optional(),
  multiline: z.boolean().optional(),
});

export const QuestionFormModelSchema = z.object({
  tempId: z.string().min(1),
  text: z.string().min(1).max(500),
  type: z.enum(['single_choice', 'multiple_choice', 'rating', 'text'] as const),
  required: z.boolean().default(true),
  config: QuestionConfigModelSchema,
});

export const BrunchFormModelSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  adminPassword: z.string().min(1),
  votingPassword: z.string().min(1).optional(),
  hasVotingPassword: z.boolean().default(false),
  questions: z.array(QuestionFormModelSchema).min(1).max(50),
});

// WebSocket Message Schemas (Enhanced)
export const EnhancedTableMessageSchema = z.object({
  type: z.enum(['JOIN', 'LEAVE', 'UPDATE', 'QUESTION_UPDATE', 'BRUNCH_UPDATE']),
  user: z.string().nullable(),
  brunchId: z.string().min(1),
  questionId: z.string().optional(),
  answer: z.unknown().optional(),
  timestamp: z.string(),
  data: z.unknown().optional(),
});

// API Error Schema
export const ApiErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  details: z.unknown().optional(),
});

// Answer Validation Schemas (by question type)
export const SingleChoiceAnswerSchema = z.string().min(1);

export const MultipleChoiceAnswerSchema = z.array(z.string().min(1)).min(1);

export const RatingAnswerSchema = z.number().int();

export const TextAnswerSchema = z.string().min(1).max(2000);

// Dynamic answer validation function
export function getAnswerSchema(questionType: QuestionType, question: any) {
  switch (questionType) {
    case 'single_choice':
      return SingleChoiceAnswerSchema.refine(
        (value) => question.options.includes(value),
        {
          message: "Answer must be one of the provided options",
        }
      );
    
    case 'multiple_choice':
      return MultipleChoiceAnswerSchema
        .refine(
          (values) => values.every(value => question.options.includes(value)),
          {
            message: "All answers must be from the provided options",
          }
        )
        .refine(
          (values) => {
            if (question.minChoices !== undefined) {
              return values.length >= question.minChoices;
            }
            return true;
          },
          {
            message: `At least ${question.minChoices} choices required`,
          }
        )
        .refine(
          (values) => {
            if (question.maxChoices !== undefined) {
              return values.length <= question.maxChoices;
            }
            return true;
          },
          {
            message: `At most ${question.maxChoices} choices allowed`,
          }
        );
    
    case 'rating':
      return RatingAnswerSchema
        .min(question.minRating, `Rating must be at least ${question.minRating}`)
        .max(question.maxRating, `Rating must be at most ${question.maxRating}`);
    
    case 'text':
      let schema = TextAnswerSchema;
      if (question.maxLength) {
        schema = schema.max(question.maxLength, `Text must be at most ${question.maxLength} characters`);
      }
      return schema;
    
    default:
      return z.unknown();
  }
}

// Validation utility functions
export function validateQuestionConfig(type: QuestionType, config: any): z.SafeParseReturnType<any, any> {
  switch (type) {
    case 'single_choice':
      return z.object({
        options: z.array(z.string().min(1)).min(2).max(10),
      }).safeParse(config);
    
    case 'multiple_choice':
      return z.object({
        options: z.array(z.string().min(1)).min(2).max(10),
        minChoices: z.number().int().min(0).optional(),
        maxChoices: z.number().int().min(1).optional(),
      }).safeParse(config);
    
    case 'rating':
      return z.object({
        minRating: z.number().int().min(1).max(10),
        maxRating: z.number().int().min(2).max(10),
      }).refine(
        (data) => data.maxRating > data.minRating,
        {
          message: "maxRating must be greater than minRating",
          path: ["maxRating"],
        }
      ).safeParse(config);
    
    case 'text':
      return z.object({
        placeholder: z.string().max(200).optional(),
        maxLength: z.number().int().min(1).max(2000).optional(),
      }).safeParse(config);
    
    default:
      return { success: false, error: new Error('Unknown question type') } as any;
  }
}

// Export commonly used types for convenience
export type BrunchCreateRequest = z.infer<typeof BrunchCreateRequestSchema>;
export type BrunchUpdateRequest = z.infer<typeof BrunchUpdateRequestSchema>;
export type BrunchInfo = z.infer<typeof BrunchInfoSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionFormModel = z.infer<typeof QuestionFormModelSchema>;
export type BrunchFormModel = z.infer<typeof BrunchFormModelSchema>;
export type EnhancedTableMessage = z.infer<typeof EnhancedTableMessageSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;