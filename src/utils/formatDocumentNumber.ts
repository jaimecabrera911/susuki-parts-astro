/**
 * Formats a document number with its prefix for display.
 * The internal id (UUID) is formatted gracefully if documentNumber is missing.
 * Example 1: { prefix: 'SZ-ORD', documentNumber: '694555' } -> 'SZ-ORD-694555'
 * Example 2: { id: '805e2835-7846...', prefix: 'SZ-ORD' } -> 'SZ-ORD-805E2835'
 */
export function formatDocumentNumber(id: string, prefix?: string, documentNumber?: string): string {
  const pre = prefix ? String(prefix).trim() : 'SZ-ORD';
  const num = documentNumber ? String(documentNumber).trim() : '';

  if (num) {
    if (pre && !num.startsWith(pre)) return `${pre}-${num}`;
    return num;
  }

  if (id) {
    const rawId = String(id).trim();
    if (rawId.includes('-') && rawId.length > 12) {
      // UUID fallback: use first section (8 chars hex)
      const shortCode = rawId.split('-')[0].toUpperCase();
      return `${pre}-${shortCode}`;
    }
    if (pre && !rawId.startsWith(pre)) return `${pre}-${rawId}`;
    return rawId;
  }

  return `${pre}-000000`;
}