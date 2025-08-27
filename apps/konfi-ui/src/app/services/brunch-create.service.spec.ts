import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { BrunchCreateService } from './brunch-create.service';

const CALLED_BRUNCH_ENDPOINT = 'http://localhost:8080/api/brunches'

describe('BrunchCreateService', () => {
  let service: BrunchCreateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BrunchCreateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(BrunchCreateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('send', () => {
    const validBrunchData = {
      title: 'Test Brunch',
      id: 'test-brunch-123',
      votingPassword: 'vote123',
      adminPassword: 'admin123',
      question: 'How much do you like brunch?',
    };

    it('should send valid brunch data successfully', () => {
      const mockResponse = { id: 'test-brunch-123', created: true };

      service.send(validBrunchData).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(CALLED_BRUNCH_ENDPOINT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        title: 'Test Brunch',
        id: 'test-brunch-123',
        adminPassword: 'admin123',
        votingPassword: 'vote123',
        questions: [
          {
            title: 'How much do you like brunch?',
            min: 1,
            max: 5,
            recomended: 1,
          },
        ],
      });

      req.flush(mockResponse);
    });

    it('should handle minimal required data', () => {
      const minimalData = {
        title: 'Simple Brunch',
        id: 'simple-123',
        question: 'Rate it',
      };

      service.send(minimalData).subscribe();

      const req = httpMock.expectOne(CALLED_BRUNCH_ENDPOINT);
      expect(req.request.body).toEqual({
        title: 'Simple Brunch',
        id: 'simple-123',
        adminPassword: null,
        votingPassword: null,
        questions: [
          {
            title: 'Rate it',
            min: 1,
            max: 5,
            recomended: 1,
          },
        ],
      });

      req.flush({});
    });

    it('should handle null passwords correctly', () => {
      const dataWithNullPasswords = {
        title: 'Test Brunch',
        id: 'test-123',
        votingPassword: null,
        adminPassword: null,
        question: 'Test question',
      };

      service.send(dataWithNullPasswords).subscribe();

      const req = httpMock.expectOne(CALLED_BRUNCH_ENDPOINT);
      expect(req.request.body.adminPassword).toBeNull();
      expect(req.request.body.votingPassword).toBeNull();

      req.flush({});
    });

    it('should throw validation error for invalid title', () => {
      const invalidData = {
        title: '',
        id: 'test-123',
        question: 'Test question',
      };

      expect(() => {
        service.send(invalidData).subscribe();
      }).toThrow();
    });

    it('should throw validation error for invalid id format', () => {
      const invalidData = {
        title: 'Valid Title',
        id: 'invalid id with spaces',
        question: 'Test question',
      };

      expect(() => {
        service.send(invalidData).subscribe();
      }).toThrow();
    });

    it('should throw validation error for short id', () => {
      const invalidData = {
        title: 'Valid Title',
        id: 'xy',
        question: 'Test question',
      };

      expect(() => {
        service.send(invalidData).subscribe();
      }).toThrow();
    });

    it('should throw validation error for long id', () => {
      const invalidData = {
        title: 'Valid Title',
        id: 'a'.repeat(51),
        question: 'Test question',
      };

      expect(() => {
        service.send(invalidData).subscribe();
      }).toThrow();
    });

    it('should throw validation error for empty question', () => {
      const invalidData = {
        title: 'Valid Title',
        id: 'valid-id',
        question: '',
      };

      expect(() => {
        service.send(invalidData).subscribe();
      }).toThrow();
    });

    it('should accept valid id with hyphens and numbers', () => {
      const validData = {
        title: 'Test Brunch',
        id: 'test-brunch-123',
        question: 'Test question',
      };

      service.send(validData).subscribe();

      const req = httpMock.expectOne(CALLED_BRUNCH_ENDPOINT);
      expect(req.request.body.id).toBe('test-brunch-123');

      req.flush({});
    });

    it('should transform question string into questions array with defaults', () => {
      const data = {
        title: 'Test Brunch',
        id: 'test-123',
        question: 'Custom Question',
      };

      service.send(data).subscribe();

      const req = httpMock.expectOne(CALLED_BRUNCH_ENDPOINT);
      expect(req.request.body.questions).toEqual([
        {
          title: 'Custom Question',
          min: 1,
          max: 5,
          recomended: 1,
        },
      ]);

      req.flush({});
    });

    it('should handle HTTP error responses', () => {
      const data = validBrunchData;

      service.send(data).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Bad Request');
        },
      });

      const req = httpMock.expectOne(CALLED_BRUNCH_ENDPOINT);
      req.flush(
        { error: 'Invalid data' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });
});
