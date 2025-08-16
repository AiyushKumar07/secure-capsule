/**
 * Configuration options for SecureCapsule
 */
export interface SecureCapsuleConfig {
  mode: 'symmetric' | 'asymmetric';
  secretKey?: string;
  publicKey?: string;
  privateKey?: string;
  algorithm?: 'AES-256-GCM' | 'RSA-OAEP';
}

/**
 * Encryption result containing ciphertext and metadata
 */
export interface EncryptionResult {
  ciphertext: string;
  algorithm: string;
  iv?: string;
  authTag?: string;
  timestamp: number;
}

/**
 * Decryption result
 */
export interface DecryptionResult {
  data: any;
  algorithm: string;
  timestamp: number;
}

/**
 * Key pair for asymmetric encryption
 */
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Environment variables structure
 */
export interface EnvironmentConfig {
  SECURE_KEY?: string;
  PUBLIC_KEY?: string;
  PRIVATE_KEY?: string;
}

/**
 * Express middleware options
 */
export interface MiddlewareOptions {
  mode?: 'symmetric' | 'asymmetric';
  secretKey?: string;
  publicKey?: string;
  autoEncrypt?: boolean;
  encryptedHeader?: string;
  fieldEncryption?: boolean; // Enable field-level encryption
  paddingFields?: number; // Number of padding fields for extra obfuscation
}

/**
 * Frontend decryption options
 */
export interface FrontendDecryptOptions {
  key: string;
  algorithm?: string;
}

/**
 * Field-level encryption result
 */
export interface FieldEncryptionResult {
  [key: string]: string | boolean | number | undefined;
  encrypted: true;
  timestamp: string;
  _mapping?: string; // Encrypted field mapping
}
