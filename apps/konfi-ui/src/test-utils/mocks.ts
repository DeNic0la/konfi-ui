import { of, Subject } from 'rxjs';
import { ZodTableMessage } from '../app/services/web-socket-connecting.service';

export const createMockWebSocketConnectingService = () => {
  const mockObserveTable = jest.fn();
  const mockJoinTable = jest.fn();
  const mockUpdateKonfiVote = jest.fn();
  const mockObserveTopic = jest.fn();
  const mockPublish = jest.fn();

  const service = {
    observeTable: mockObserveTable,
    joinTable: mockJoinTable,
    updateKonfiVote: mockUpdateKonfiVote,
    observeTopic: mockObserveTopic,
    publish: mockPublish,
  };

  // Default implementations
  mockObserveTable.mockReturnValue(of(null));
  mockObserveTopic.mockReturnValue(of({}));
  mockPublish.mockReturnValue(undefined);

  return {
    service,
    mocks: {
      mockObserveTable,
      mockJoinTable,
      mockUpdateKonfiVote,
      mockObserveTopic,
      mockPublish,
    },
  };
};

export const createMockHttpClient = () => {
  const mockPost = jest.fn();
  const mockGet = jest.fn();
  const mockPut = jest.fn();
  const mockDelete = jest.fn();

  const httpClient = {
    post: mockPost,
    get: mockGet,
    put: mockPut,
    delete: mockDelete,
  };

  // Default implementations
  mockPost.mockReturnValue(of({}));
  mockGet.mockReturnValue(of({}));
  mockPut.mockReturnValue(of({}));
  mockDelete.mockReturnValue(of({}));

  return { httpClient, mocks: { mockPost, mockGet, mockPut, mockDelete } };
};

export const createMockTableMessage = (
  overrides: Partial<ZodTableMessage> = {}
): ZodTableMessage => ({
  type: 'JOIN',
  konfi: 0,
  user: 'testUser',
  ...overrides,
});

export const createMockClipboard = () => {
  const mockCopy = jest.fn();

  const clipboard = {
    copy: mockCopy,
  };

  mockCopy.mockReturnValue(true);

  return { clipboard, mocks: { mockCopy } };
};

// Test utilities for testing RxJS streams
export const createTestSubject = <T>() => {
  const subject = new Subject<T>();
  const values: T[] = [];
  const errors: any[] = [];
  let completed = false;

  const subscription = subject.subscribe({
    next: (value) => values.push(value),
    error: (error) => errors.push(error),
    complete: () => (completed = true),
  });

  return {
    subject,
    values,
    errors,
    completed,
    subscription,
    cleanup: () => subscription.unsubscribe(),
  };
};
