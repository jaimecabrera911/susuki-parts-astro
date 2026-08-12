import type { UserProfile } from '../types';

// Client-side auth helpers. The app persists an ad-hoc session in localStorage
// (sz_is_logged_in / sz_user_profile). Server-side/auth-protected flows can
// strengthen this later; these helpers centralize the reads for route guards.

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

export function isAdminUser(user?: UserProfile | null): boolean {
  return !!user && user.role === 'admin';
}

export function isLoggedInUser(user?: UserProfile | null): boolean {
  return !!user && !!user.id;
}