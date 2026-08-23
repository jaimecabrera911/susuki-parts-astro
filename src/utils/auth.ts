import type { UserProfile, DashboardModule } from '../types';

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

export function isSuperAdminUser(user?: UserProfile | null): boolean {
  return !!user && user.role === 'superadmin';
}

export function isAdminUser(user?: UserProfile | null): boolean {
  return !!user && Boolean(user.role) && user.role !== 'customer';
}

export function isLoggedInUser(user?: UserProfile | null): boolean {
  return !!user && !!user.id;
}

export function hasModulePermission(
  user?: UserProfile | null,
  module?: string,
  action: 'read' | 'write' = 'read'
): boolean {
  if (!user) return false;
  if (user.role === 'customer') return false;
  if (user.role === 'superadmin') return true;

  // Backward compatibility: If no permissions array is defined for a legacy admin, default to full access
  if (user.role === 'admin' && (!user.permissions || user.permissions.length === 0)) {
    return true;
  }

  // If user has permissions array configured from their role or user permissions:
  if (user.permissions && user.permissions.length > 0) {
    const perm = user.permissions.find(p => p.module === module);
    if (!perm) return false;
    return action === 'write' ? Boolean(perm.canWrite) : Boolean(perm.canRead);
  }

  return false;
}