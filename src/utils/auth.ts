import type { UserProfile } from '../types';

export function getStoredLogin(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('sz_is_logged_in') === 'true';
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('sz_user_profile');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed.id || parsed.email)) {
      return parsed as UserProfile;
    }
  } catch {
    // ignore malformed profile
  }
  return null;
}

export function getStoredJwtToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sz_jwt_token');
}

export function setStoredSession(user: UserProfile, token?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sz_is_logged_in', 'true');
  localStorage.setItem('sz_user_profile', JSON.stringify(user));
  if (token) {
    localStorage.setItem('sz_jwt_token', token);
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sz_is_logged_in');
  localStorage.removeItem('sz_user_profile');
  localStorage.removeItem('sz_jwt_token');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredJwtToken();
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

export function isAdminUser(user?: UserProfile | null): boolean {
  return !!user && user.role === 'admin';
}

export function isLoggedInUser(user?: UserProfile | null): boolean {
  return !!user && !!user.id;
}