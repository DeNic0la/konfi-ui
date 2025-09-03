import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthState {
  brunchId: string;
  adminPassword?: string;
  votingPassword?: string;
  isAuthenticated: boolean;
  hasAdminAccess: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_PREFIX = 'konfi_auth_';
  private authState$ = new BehaviorSubject<Map<string, AuthState>>(new Map());

  constructor() {
    this.loadAuthState();
  }

  // Admin Password Management
  setAdminPassword(brunchId: string, password: string): void {
    this.updateAuthState(brunchId, {
      adminPassword: password,
      hasAdminAccess: true,
      isAuthenticated: true
    });
    this.saveToStorage(brunchId, { adminPassword: password });
  }

  getAdminPassword(brunchId: string): string | null {
    const state = this.getAuthState(brunchId);
    return state?.adminPassword || null;
  }

  hasAdminAccess(brunchId: string): boolean {
    const state = this.getAuthState(brunchId);
    return state?.hasAdminAccess || false;
  }

  clearAdminPassword(brunchId: string): void {
    this.updateAuthState(brunchId, {
      adminPassword: undefined,
      hasAdminAccess: false
    });
    this.removeFromStorage(brunchId, 'adminPassword');
  }

  // Voting Password Management
  setVotingPassword(brunchId: string, password: string): void {
    this.updateAuthState(brunchId, {
      votingPassword: password,
      isAuthenticated: true
    });
    this.saveToStorage(brunchId, { votingPassword: password });
  }

  getVotingPassword(brunchId: string): string | null {
    const state = this.getAuthState(brunchId);
    return state?.votingPassword || null;
  }

  clearVotingPassword(brunchId: string): void {
    this.updateAuthState(brunchId, {
      votingPassword: undefined
    });
    this.removeFromStorage(brunchId, 'votingPassword');
  }

  // General Authentication
  isAuthenticated(brunchId: string): boolean {
    const state = this.getAuthState(brunchId);
    return state?.isAuthenticated || false;
  }

  clearAllPasswords(brunchId: string): void {
    const currentState = this.authState$.value;
    currentState.delete(brunchId);
    this.authState$.next(currentState);
    this.clearStorageForBrunch(brunchId);
  }

  // Observable State Management
  getAuthState$(brunchId: string): Observable<AuthState | undefined> {
    return new Observable(observer => {
      const subscription = this.authState$.subscribe(stateMap => {
        observer.next(stateMap.get(brunchId));
      });
      return () => subscription.unsubscribe();
    });
  }

  getAllAuthStates$(): Observable<Map<string, AuthState>> {
    return this.authState$.asObservable();
  }

  // Password Validation Helpers
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 6) {
      feedback.push('Password should be at least 6 characters long');
    } else {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one uppercase letter');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one number');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one special character');
    }

    return {
      isValid: score >= 3,
      score,
      feedback
    };
  }

  generateSecurePassword(length = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each required set
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Session Management
  startSession(brunchId: string): void {
    this.updateAuthState(brunchId, {
      brunchId,
      isAuthenticated: false,
      hasAdminAccess: false
    });
  }

  endSession(brunchId: string): void {
    this.clearAllPasswords(brunchId);
  }

  // Cleanup and Maintenance
  cleanupExpiredSessions(): void {
    const currentState = this.authState$.value;
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    currentState.forEach((state, brunchId) => {
      const stored = this.getFromStorage(brunchId);
      if (stored?.timestamp && now - stored.timestamp > maxAge) {
        this.clearAllPasswords(brunchId);
      }
    });
  }

  // Private Helper Methods
  private getAuthState(brunchId: string): AuthState | undefined {
    return this.authState$.value.get(brunchId);
  }

  private updateAuthState(brunchId: string, updates: Partial<AuthState>): void {
    const currentState = this.authState$.value;
    const existingState = currentState.get(brunchId) || {
      brunchId,
      isAuthenticated: false,
      hasAdminAccess: false
    };

    const newState = { ...existingState, ...updates };
    currentState.set(brunchId, newState);
    this.authState$.next(currentState);
  }

  // Local Storage Management
  private saveToStorage(brunchId: string, data: { adminPassword?: string; votingPassword?: string }): void {
    try {
      const existing = this.getFromStorage(brunchId) || {};
      const updated = {
        ...existing,
        ...data,
        timestamp: Date.now()
      };
      localStorage.setItem(
        `${this.STORAGE_PREFIX}${brunchId}`,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.warn('Failed to save auth data to localStorage:', error);
    }
  }

  private getFromStorage(brunchId: string): any | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${brunchId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to read auth data from localStorage:', error);
      return null;
    }
  }

  private removeFromStorage(brunchId: string, key: string): void {
    try {
      const existing = this.getFromStorage(brunchId);
      if (existing) {
        delete existing[key];
        if (Object.keys(existing).length <= 1) { // Only timestamp remains
          this.clearStorageForBrunch(brunchId);
        } else {
          localStorage.setItem(
            `${this.STORAGE_PREFIX}${brunchId}`,
            JSON.stringify(existing)
          );
        }
      }
    } catch (error) {
      console.warn('Failed to update auth data in localStorage:', error);
    }
  }

  private clearStorageForBrunch(brunchId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${brunchId}`);
    } catch (error) {
      console.warn('Failed to clear auth data from localStorage:', error);
    }
  }

  private loadAuthState(): void {
    try {
      const currentState = new Map<string, AuthState>();

      // Load from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          const brunchId = key.substring(this.STORAGE_PREFIX.length);
          const stored = this.getFromStorage(brunchId);
          
          if (stored) {
            currentState.set(brunchId, {
              brunchId,
              adminPassword: stored.adminPassword,
              votingPassword: stored.votingPassword,
              isAuthenticated: !!(stored.adminPassword || stored.votingPassword),
              hasAdminAccess: !!stored.adminPassword
            });
          }
        }
      }

      this.authState$.next(currentState);
      
      // Cleanup expired sessions
      this.cleanupExpiredSessions();
    } catch (error) {
      console.warn('Failed to load auth state from localStorage:', error);
      this.authState$.next(new Map());
    }
  }

  // Security Utilities
  hashPassword(password: string): string {
    // Simple hash for client-side password comparison
    // Note: In production, use a proper hashing library
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Password Visibility Helper
  togglePasswordVisibility(inputElement: HTMLInputElement): void {
    inputElement.type = inputElement.type === 'password' ? 'text' : 'password';
  }

  // Copy to Clipboard Helper
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (fallbackError) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }
}