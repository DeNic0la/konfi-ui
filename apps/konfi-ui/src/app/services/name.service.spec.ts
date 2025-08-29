import { TestBed } from '@angular/core/testing';
import { NameService } from './name.service';

describe('NameService', () => {
  let service: NameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty username and unconfirmed state', () => {
    expect(service.username).toBe('');
    expect(service.nameConfirmed).toBe(false);
  });

  describe('confirmName', () => {
    it('should confirm name when username is not empty', () => {
      service.username = 'testuser';

      service.confirmName();

      expect(service.nameConfirmed).toBe(true);
    });

    it('should not confirm name when username is empty', () => {
      service.username = '';

      service.confirmName();

      expect(service.nameConfirmed).toBe(false);
    });

    it('should not confirm name when username is only whitespace', () => {
      service.username = '   ';

      service.confirmName();

      expect(service.nameConfirmed).toBe(false);
    });

    it('should confirm name when username has leading/trailing spaces but content', () => {
      service.username = '  testuser  ';

      service.confirmName();

      expect(service.nameConfirmed).toBe(true);
    });

    it('should allow multiple confirmations', () => {
      service.username = 'testuser';

      service.confirmName();
      expect(service.nameConfirmed).toBe(true);

      service.confirmName();
      expect(service.nameConfirmed).toBe(true);
    });

    it('should handle special characters in username', () => {
      service.username = 'test-user_123';

      service.confirmName();

      expect(service.nameConfirmed).toBe(true);
    });

    it('should handle unicode characters in username', () => {
      service.username = 'tëst-üser';

      service.confirmName();

      expect(service.nameConfirmed).toBe(true);
    });
  });

  describe('state management', () => {
    it('should allow changing username after confirmation', () => {
      service.username = 'firstuser';
      service.confirmName();
      expect(service.nameConfirmed).toBe(true);

      service.username = 'seconduser';
      // Note: confirmation state persists until explicitly reset or confirmName is called again
      expect(service.username).toBe('seconduser');
      expect(service.nameConfirmed).toBe(true);
    });

    it('should maintain state after username changes', () => {
      service.username = 'testuser';
      service.confirmName();

      service.username = 'newuser';

      expect(service.nameConfirmed).toBe(true);
      expect(service.username).toBe('newuser');
    });
  });
});
