import crypto from 'crypto';

/**
 * Generate a secure random token for email verification
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate an expiration date for email verification (24 hours from now)
 */
export function generateTokenExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration;
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expirationDate: Date): boolean {
  return new Date() > expirationDate;
}