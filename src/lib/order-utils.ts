import { randomBytes } from 'crypto';

/**
 * Generate a human-readable order number: CLZ-YYYYMMDD-XXXX
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `CLZ-${y}${m}${d}-${suffix}`;
}

/**
 * Generate a secure access token for magic links
 */
export function generateAccessToken(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * Generate a short slug for gift pages
 */
export function generateGiftSlug(): string {
  return randomBytes(6).toString('base64url');
}

/**
 * Convert dollar amount to cents for storage
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollar display string
 */
export function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
