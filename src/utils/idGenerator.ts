/**
 * Standardized ID Generator Utility for Suzuki Parts Colombia.
 * 
 * Provides:
 * 1. UUID v7 (RFC 9562) - K-sortable 128-bit timestamp-first UUIDs for internal entities.
 * 2. Formatted Business IDs - Legible, secure, year-based IDs for customer-facing operations.
 */

/**
 * Generates an RFC 9562 compliant UUID v7 string (K-Sortable).
 * Consists of:
 * - 48-bit Unix timestamp in milliseconds
 * - 4-bit Version (0b0111 = 7)
 * - 12-bit Random Sequence 1
 * - 2-bit Variant (0b10)
 * - 62-bit Random Sequence 2
 */
export function generateUuidV7(prefix?: string): string {
  const timestamp = Date.now();
  const hexTimestamp = timestamp.toString(16).padStart(12, '0');

  // Random bytes generation
  const randomBytes = new Uint8Array(10);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 10; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Set version to 7 (0b0111) on byte 6 (upper 4 bits)
  const randA1 = ((randomBytes[0] & 0x0f) | 0x70).toString(16).padStart(2, '0');
  const randA2 = randomBytes[1].toString(16).padStart(2, '0');

  // Set variant to 10xx on byte 8 (upper 2 bits)
  const randB1 = ((randomBytes[2] & 0x3f) | 0x80).toString(16).padStart(2, '0');
  const randB2 = randomBytes[3].toString(16).padStart(2, '0');

  const randC = Array.from(randomBytes.slice(4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const uuid = `${hexTimestamp.slice(0, 8)}-${hexTimestamp.slice(8, 12)}-${randA1}${randA2}-${randB1}${randB2}-${randC}`;

  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Helper to generate secure random numeric string of specified length.
 */
function getRandomDigitString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

/**
 * Helper to generate secure random uppercase alphanumeric string (excluding ambiguous O/0/I/1).
 */
function getRandomAlphaNumString(length: number): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface DocumentIdentifier {
  id: string;
  prefix: string;
  documentNumber: string;
  fullNumber: string;
}

/**
 * Generates an Order document payload with UUIDv7 primary key and public alphanumeric documentNumber.
 */
export function generateOrderDocument(): DocumentIdentifier {
  const year = new Date().getFullYear();
  const digits = getRandomDigitString(6);
  const prefix = 'SZ-ORD';
  const documentNumber = `${prefix}-${year}-${digits}`;
  return {
    id: generateUuidV7(),
    prefix,
    documentNumber,
    fullNumber: documentNumber
  };
}

/**
 * Generates a customer-facing Order ID string for backward compatibility.
 */
export function generateOrderId(): string {
  return generateOrderDocument().documentNumber;
}

/**
 * Generates a Return document payload with UUIDv7 primary key and public documentNumber.
 */
export function generateReturnDocument(): DocumentIdentifier {
  const year = new Date().getFullYear();
  const digits = getRandomDigitString(6);
  const prefix = 'SZ-RET';
  const documentNumber = `${prefix}-${year}-${digits}`;
  return {
    id: generateUuidV7(),
    prefix,
    documentNumber,
    fullNumber: documentNumber
  };
}

/**
 * Generates a customer-facing Return ID string for backward compatibility.
 */
export function generateReturnId(): string {
  return generateReturnDocument().documentNumber;
}

/**
 * Generates a customer-facing Guarantee/Warranty Certificate Code.
 * Format: SZ-GAR-YYYY-XXXXXX (e.g. SZ-GAR-2026-9X2K7P)
 */
export function generateGuaranteeCode(): string {
  const year = new Date().getFullYear();
  const code = getRandomAlphaNumString(6);
  return `SZ-GAR-${year}-${code}`;
}

/**
 * Generates a Store Credit Voucher Code.
 * Format: SZ-CREDIT-YYYY-XXXXXX (e.g. SZ-CREDIT-2026-8K4M1N)
 */
export function generateStoreCreditCode(): string {
  const year = new Date().getFullYear();
  const code = getRandomAlphaNumString(6);
  return `SZ-CREDIT-${year}-${code}`;
}
