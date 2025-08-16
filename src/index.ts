/**
 * Secure Capsule - Universal encryption library for full-stack JavaScript
 * 
 * This library provides simple encryption & decryption utilities for both 
 * Node.js (backend) and browser (frontend) with minimal setup.
 */

// Core exports
export { SecureCapsule } from './core/SecureCapsule';
export { FieldEncryption } from './core/FieldEncryption';

// Type definitions
export type {
  SecureCapsuleConfig,
  EncryptionResult,
  DecryptionResult,
  KeyPair,
  EnvironmentConfig,
  MiddlewareOptions,
  FrontendDecryptOptions,
  FieldEncryptionResult,
} from './types';

// Utility functions
export {
  loadEnvironmentConfig,
  validateKeys,
  generateSecretKey,
  keyToBuffer,
  bufferToKey,
} from './utils/environment';

// Symmetric encryption (Node.js)
export {
  encryptSymmetric,
  decryptSymmetric,
  encryptSymmetricForTransmission,
  decryptSymmetricFromTransmission,
} from './symmetric/aes';

// Asymmetric encryption (Node.js)
export {
  encryptAsymmetric,
  decryptAsymmetric,
  encryptAsymmetricForTransmission,
  decryptAsymmetricFromTransmission,
  generateKeyPair,
  signData,
  verifySignature,
} from './asymmetric/rsa';

// Express middleware
export {
  createSecureMiddleware,
  createSymmetricMiddleware,
  createAsymmetricMiddleware,
  createDecryptMiddleware,
} from './middleware/express';

// Frontend utilities (Browser)
export {
  encryptBrowser,
  decryptBrowser,
  decryptResponse,
  fetchSecure,
  generateSecretKeyBrowser,
} from './frontend/browser';

// Convenience functions
// Re-import for convenience functions
import { SecureCapsule } from './core/SecureCapsule';

/**
 * Quick encrypt function using default configuration
 */
export function encrypt(data: string | object, key?: string): string {
  const capsule = new SecureCapsule(key ? { secretKey: key } : undefined);
  return capsule.encrypt(data);
}

/**
 * Quick decrypt function using default configuration
 */
export function decrypt(cipherText: string, key?: string): any {
  const capsule = new SecureCapsule(key ? { secretKey: key } : undefined);
  return capsule.decrypt(cipherText);
}

// Re-export SecureCapsule as default export
export { SecureCapsule as default } from './core/SecureCapsule';
