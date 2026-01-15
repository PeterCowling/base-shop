/**
 * PIN Security Utilities
 *
 * Provides secure hashing and verification for PINs using bcrypt.
 * PINs are hashed before storage and verified using constant-time comparison.
 */

import bcrypt from 'bcryptjs';

// Cost factor for bcrypt (10-12 is recommended for most applications)
// Higher = more secure but slower
const SALT_ROUNDS = 10;

/**
 * Hash a PIN for secure storage.
 *
 * @param pin - The plain text PIN to hash
 * @returns The hashed PIN (bcrypt format includes salt)
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a PIN against a stored hash.
 * Uses bcrypt's constant-time comparison to prevent timing attacks.
 *
 * @param pin - The plain text PIN to verify
 * @param hashedPin - The stored hashed PIN
 * @returns true if the PIN matches, false otherwise
 */
export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  return bcrypt.compare(pin, hashedPin);
}

/**
 * Check if a stored PIN value is already hashed.
 * bcrypt hashes start with "$2a$" or "$2b$" prefix.
 *
 * This is useful for migrating from plain-text to hashed storage.
 *
 * @param storedValue - The stored PIN value
 * @returns true if the value appears to be a bcrypt hash
 */
export function isPinHashed(storedValue: string): boolean {
  // bcrypt hashes are 60 characters and start with $2a$ or $2b$
  return storedValue.length === 60 && /^\$2[ab]\$/.test(storedValue);
}
