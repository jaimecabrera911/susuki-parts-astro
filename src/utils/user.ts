/**
 * Extracts initials from a user's full name.
 * Examples:
 * - "Carlos Alberto Mendoza" -> "CM"
 * - "Ana María Restrepo" -> "AR"
 * - "Juan Pérez" -> "JP"
 * - "Jorge Silva" -> "JS"
 * - "Carlos" -> "CA"
 */
export function getUserInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const clean = name.trim();
  if (!clean) return 'U';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }

  const firstInitial = parts[0][0] || '';
  const lastInitial = parts[parts.length - 1][0] || '';
  return (firstInitial + lastInitial).toUpperCase();
}
