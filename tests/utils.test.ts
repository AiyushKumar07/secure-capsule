import { 
  generateSecretKey, 
  keyToBuffer, 
  bufferToKey, 
  validateKeys 
} from '../src/utils/environment';
import { generateKeyPair } from '../src/asymmetric/rsa';

describe('Utility Functions', () => {
  describe('Key Generation and Conversion', () => {
    test('should generate valid secret key', () => {
      const key = generateSecretKey();
      
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
      
      // Should be base64 encoded
      expect(() => Buffer.from(key, 'base64')).not.toThrow();
      
      // Should be 32 bytes (256 bits) when decoded
      const buffer = Buffer.from(key, 'base64');
      expect(buffer.length).toBe(32);
    });

    test('should generate different keys each time', () => {
      const key1 = generateSecretKey();
      const key2 = generateSecretKey();
      
      expect(key1).not.toBe(key2);
    });

    test('should convert key to buffer and back', () => {
      const originalKey = generateSecretKey();
      const buffer = keyToBuffer(originalKey);
      const convertedKey = bufferToKey(buffer);
      
      expect(convertedKey).toBe(originalKey);
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });

  describe('Key Validation', () => {
    test('should validate symmetric keys correctly', () => {
      const secretKey = generateSecretKey();
      
      // Valid symmetric config
      expect(validateKeys('symmetric', { SECURE_KEY: secretKey })).toBe(true);
      
      // Invalid symmetric config
      expect(validateKeys('symmetric', {})).toBe(false);
      expect(validateKeys('symmetric', { SECURE_KEY: '' })).toBe(false);
    });

    test('should validate asymmetric keys correctly', () => {
      const keyPair = generateKeyPair();
      
      // Valid asymmetric config
      expect(validateKeys('asymmetric', {
        PUBLIC_KEY: keyPair.publicKey,
        PRIVATE_KEY: keyPair.privateKey,
      })).toBe(true);
      
      // Invalid asymmetric configs
      expect(validateKeys('asymmetric', {})).toBe(false);
      expect(validateKeys('asymmetric', { PUBLIC_KEY: keyPair.publicKey })).toBe(false);
      expect(validateKeys('asymmetric', { PRIVATE_KEY: keyPair.privateKey })).toBe(false);
    });
  });

  describe('RSA Key Generation', () => {
    test('should generate valid RSA key pair', () => {
      const keyPair = generateKeyPair();
      
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.privateKey).toBe('string');
      
      // Keys should be base64 encoded
      expect(() => Buffer.from(keyPair.publicKey, 'base64')).not.toThrow();
      expect(() => Buffer.from(keyPair.privateKey, 'base64')).not.toThrow();
    });

    test('should generate different key pairs each time', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });

    test('should generate keys that can be used for encryption', () => {
      const keyPair = generateKeyPair();
      
      // Test that keys are valid PEM format when decoded
      const publicKeyPem = Buffer.from(keyPair.publicKey, 'base64').toString('utf8');
      const privateKeyPem = Buffer.from(keyPair.privateKey, 'base64').toString('utf8');
      
      expect(publicKeyPem).toContain('BEGIN PUBLIC KEY');
      expect(publicKeyPem).toContain('END PUBLIC KEY');
      expect(privateKeyPem).toContain('BEGIN PRIVATE KEY');
      expect(privateKeyPem).toContain('END PRIVATE KEY');
    });
  });
});
