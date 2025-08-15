import * as crypto from 'crypto';
import { EncryptionResult, DecryptionResult } from '../types';
import { keyToBuffer } from '../utils/environment';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is 16 bytes
const TAG_LENGTH = 16; // Authentication tag length

/**
 * Encrypt data using AES-256-GCM
 */
export function encryptSymmetric(data: string | object, secretKey: string): EncryptionResult {
  try {
    // Convert data to JSON string if it's an object
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Convert base64 key to buffer
    const key = keyToBuffer(secretKey);
    
    // Create cipher using createCipheriv with proper parameters
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as any;
    
    // For authenticated encryption, set additional authenticated data
    if (cipher.setAAD) {
      cipher.setAAD(Buffer.from('secure-capsule'));
    }
    
    // Encrypt
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    
    // Get authentication tag if available
    let authTag = '';
    try {
      if (cipher.getAuthTag) {
        authTag = cipher.getAuthTag().toString('base64');
      }
    } catch (e) {
      // GCM might not be available, continue without auth tag
    }
    
    return {
      ciphertext,
      algorithm: ALGORITHM,
      iv: iv.toString('base64'),
      authTag,
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new Error(`Symmetric encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptSymmetric(encryptionResult: EncryptionResult, secretKey: string): DecryptionResult {
  try {
    // Convert base64 strings back to buffers
    const key = keyToBuffer(secretKey);
    const iv = Buffer.from(encryptionResult.iv!, 'base64');
    
    // Create decipher using createDecipheriv
    const decipher = crypto.createDecipheriv(encryptionResult.algorithm, key, iv) as any;
    
    // Set additional authenticated data if available
    if (decipher.setAAD) {
      decipher.setAAD(Buffer.from('secure-capsule'));
    }
    
    // Set authentication tag if available
    if (encryptionResult.authTag && decipher.setAuthTag) {
      const authTag = Buffer.from(encryptionResult.authTag, 'base64');
      decipher.setAuthTag(authTag);
    }
    
    // Decrypt
    let plaintext = decipher.update(encryptionResult.ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
    
    // Try to parse as JSON, fallback to string
    let data: any;
    try {
      data = JSON.parse(plaintext);
    } catch {
      data = plaintext;
    }
    
    return {
      data,
      algorithm: encryptionResult.algorithm,
      timestamp: encryptionResult.timestamp,
    };
  } catch (error) {
    throw new Error(`Symmetric decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt data and return base64 encoded result for easy transmission
 */
export function encryptSymmetricForTransmission(data: string | object, secretKey: string): string {
  const result = encryptSymmetric(data, secretKey);
  return Buffer.from(JSON.stringify(result)).toString('base64');
}

/**
 * Decrypt base64 encoded data from transmission
 */
export function decryptSymmetricFromTransmission(encodedData: string, secretKey: string): any {
  try {
    const encryptionResult = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'));
    const result = decryptSymmetric(encryptionResult, secretKey);
    return result.data;
  } catch (error) {
    throw new Error(`Failed to decrypt transmission data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
