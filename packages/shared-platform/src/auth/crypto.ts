/**
 * Encryption utilities for API key storage
 * Uses AES-256-GCM for authenticated encryption
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16;
const TAG_POSITION = IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 * Must be a 32-byte hex string (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  if (key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 32-byte hex string (64 characters)",
    );
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt an API key
 * Format: IV (16 bytes) + auth tag (16 bytes) + encrypted data
 *
 * @param plaintext - The API key to encrypt
 * @returns Base64-encoded encrypted string
 */
export async function encryptApiKey(plaintext: string): Promise<string> {
  if (!plaintext || plaintext.trim() === "") {
    throw new Error("Cannot encrypt empty string");
  }

  try {
    const key = getEncryptionKey();

    // Generate random IV
    const iv = randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine: IV + tag + encrypted data
    const result = Buffer.concat([iv, tag, encrypted]);

    // Return as base64
    return result.toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt API key");
  }
}

/**
 * Decrypt an API key
 *
 * @param encrypted - Base64-encoded encrypted string
 * @returns Decrypted API key
 */
export async function decryptApiKey(encrypted: string): Promise<string> {
  if (!encrypted || encrypted.trim() === "") {
    throw new Error("Cannot decrypt empty string");
  }

  try {
    const key = getEncryptionKey();

    // Decode from base64
    const buffer = Buffer.from(encrypted, "base64");

    // Extract components: IV (16) + tag (16) + encrypted data
    const iv = buffer.subarray(0, IV_LENGTH);
    const tag = buffer.subarray(IV_LENGTH, ENCRYPTED_POSITION);
    const encryptedData = buffer.subarray(ENCRYPTED_POSITION);

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt API key - data may be corrupted");
  }
}

/**
 * Mask an API key for display (show first 3 and last 3 chars)
 * Example: sk-proj-abc...xyz
 *
 * @param apiKey - The API key to mask
 * @returns Masked key
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return "***";
  }

  const start = apiKey.substring(0, 7);
  const end = apiKey.substring(apiKey.length - 3);

  return `${start}...${end}`;
}

/**
 * Check if a value is an encrypted key (base64 format check)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;

  // Check if it's valid base64
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(value) && value.length > 100;
}
