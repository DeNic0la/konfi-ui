import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  BrunchCreateRequest, 
  BrunchUpdateRequest, 
  BrunchInfo, 
  BrunchVoteRequest,
  BrunchResults,
  ApiError,
  Question
} from '../types/api.types';
import { 
  BrunchCreateRequestSchema,
  BrunchUpdateRequestSchema,
  BrunchInfoSchema,
  BrunchVoteRequestSchema,
  QuestionSchema,
  ApiErrorSchema
} from '../zod/api.schemas';

@Injectable({
  providedIn: 'root'
})
export class BrunchApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.backendUrl;

  // Brunch CRUD Operations
  createBrunch(data: BrunchCreateRequest): Observable<BrunchInfo> {
    const validData = BrunchCreateRequestSchema.parse(data);
    return this.http.post<BrunchInfo>(`${this.baseUrl}/brunches`, validData)
      .pipe(
        map(response => BrunchInfoSchema.parse(response)),
        catchError(this.handleApiError)
      );
  }

  getBrunch(id: string, adminPassword?: string): Observable<BrunchInfo> {
    const headers = this.createAuthHeaders(adminPassword);
    return this.http.get<BrunchInfo>(`${this.baseUrl}/brunches/${id}`, { headers })
      .pipe(
        map(response => BrunchInfoSchema.parse(response)),
        catchError(this.handleApiError)
      );
  }

  listBrunches(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/brunches`)
      .pipe(catchError(this.handleApiError));
  }

  updateBrunch(id: string, data: BrunchUpdateRequest, adminPassword: string): Observable<BrunchInfo> {
    const validData = BrunchUpdateRequestSchema.parse(data);
    const headers = this.createAuthHeaders(adminPassword);
    return this.http.put<BrunchInfo>(`${this.baseUrl}/brunches/${id}`, validData, { headers })
      .pipe(
        map(response => BrunchInfoSchema.parse(response)),
        catchError(this.handleApiError)
      );
  }

  deleteBrunch(id: string, adminPassword: string): Observable<void> {
    const headers = this.createAuthHeaders(adminPassword);
    return this.http.delete<void>(`${this.baseUrl}/brunches/${id}`, { headers })
      .pipe(catchError(this.handleApiError));
  }

  // Voting Operations
  submitVote(brunchId: string, vote: BrunchVoteRequest, votingPassword?: string): Observable<void> {
    const validVote = BrunchVoteRequestSchema.parse(vote);
    const headers = this.createVotingHeaders(votingPassword);
    return this.http.post<void>(`${this.baseUrl}/brunches/${brunchId}/vote`, validVote, { headers })
      .pipe(catchError(this.handleApiError));
  }

  getVoteResults(brunchId: string, adminPassword: string): Observable<BrunchResults> {
    const headers = this.createAuthHeaders(adminPassword);
    return this.http.get<BrunchResults>(`${this.baseUrl}/brunches/${brunchId}/results`, { headers })
      .pipe(catchError(this.handleApiError));
  }

  // Helper Methods for Authentication Headers
  private createAuthHeaders(adminPassword?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (adminPassword) {
      headers = headers.set('X-ADMIN-PASSWORD', adminPassword);
    }
    
    return headers;
  }

  private createVotingHeaders(votingPassword?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (votingPassword) {
      headers = headers.set('X-VOTING-PASSWORD', votingPassword);
    }
    
    return headers;
  }

  // Error Handling
  private handleApiError = (error: HttpErrorResponse): Observable<never> => {
    let apiError: ApiError;

    if (error.error && typeof error.error === 'object') {
      // Try to parse structured API error
      const parseResult = ApiErrorSchema.safeParse(error.error);
      if (parseResult.success) {
        apiError = parseResult.data;
      } else {
        apiError = {
          message: error.error.message || error.message || 'An error occurred',
          code: error.status.toString(),
          details: error.error
        };
      }
    } else {
      // Handle generic HTTP errors
      apiError = {
        message: this.getErrorMessage(error.status, error.message),
        code: error.status.toString(),
        details: error.error
      };
    }

    return throwError(() => apiError);
  };

  private getErrorMessage(status: number, defaultMessage: string): string {
    switch (status) {
      case 400:
        return 'Invalid request data. Please check your input and try again.';
      case 401:
        return 'Invalid admin password. Please check your credentials.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'Brunch not found. It may have been deleted or the ID is incorrect.';
      case 409:
        return 'A brunch with this ID already exists. Please choose a different ID.';
      case 422:
        return 'Invalid data provided. Please check your input and try again.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return defaultMessage || 'An unexpected error occurred. Please try again.';
    }
  }

  // Utility Methods for Frontend
  validateBrunchId(id: string): boolean {
    return /^[a-zA-Z0-9-]+$/.test(id) && id.length >= 3 && id.length <= 50;
  }

  sanitizeBrunchId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  // Question Validation Helpers
  validateQuestion(question: any): { valid: boolean; errors: string[] } {
    try {
      // Basic validation for required fields
      const errors: string[] = [];
      
      if (!question.text || typeof question.text !== 'string') {
        errors.push('Question text is required');
      }
      if (!question.type) {
        errors.push('Question type is required');
      }
      if (typeof question.required !== 'boolean') {
        errors.push('Question required field must be boolean');
      }
      
      return { valid: errors.length === 0, errors };
    } catch (error: any) {
      return { valid: false, errors: ['Invalid question data'] };
    }
  }

  // Data Transformation Helpers
  transformFormToBrunchRequest(formData: any): BrunchCreateRequest {
    return {
      name: formData.name,
      description: formData.description || undefined,
      adminPassword: formData.adminPassword,
      votingPassword: formData.hasVotingPassword ? formData.votingPassword : undefined,
      questions: formData.questions.map((q: any) => this.transformFormToQuestion(q))
    };
  }

  private transformFormToQuestion(formQuestion: any): any {
    const question: any = {
      text: formQuestion.text,
      type: formQuestion.type,
      required: formQuestion.required
    };

    // Add type-specific properties
    switch (formQuestion.type) {
      case 'single_choice':
        question.options = formQuestion.config.options || [];
        break;
      
      case 'multiple_choice':
        question.options = formQuestion.config.options || [];
        if (formQuestion.config.minChoices !== undefined) {
          question.minChoices = formQuestion.config.minChoices;
        }
        if (formQuestion.config.maxChoices !== undefined) {
          question.maxChoices = formQuestion.config.maxChoices;
        }
        break;
      
      case 'rating':
        question.minRating = formQuestion.config.minRating || 1;
        question.maxRating = formQuestion.config.maxRating || 5;
        break;
      
      case 'text':
        if (formQuestion.config.placeholder) {
          question.placeholder = formQuestion.config.placeholder;
        }
        if (formQuestion.config.maxLength !== undefined) {
          question.maxLength = formQuestion.config.maxLength;
        }
        break;
      
      default:
        throw new Error(`Unknown question type: ${formQuestion.type}`);
    }

    return question;
  }

  // Brunch Status Helpers
  getBrunchUrl(brunchId: string): string {
    return `${window.location.origin}/table/${brunchId}`;
  }

  getAdminUrl(brunchId: string): string {
    return `${window.location.origin}/table/admin/${brunchId}`;
  }

  // QR Code Helper (for admin view)
  getQRCodeUrl(text: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  }
}