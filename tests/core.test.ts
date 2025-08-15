import { SecureCapsule } from '../src/core/SecureCapsule';
import { generateSecretKey } from '../src/utils/environment';
import { generateKeyPair } from '../src/asymmetric/rsa';

describe('SecureCapsule Core', () => {
  let secretKey: string;
  let keyPair: any;

  beforeAll(() => {
    secretKey = generateSecretKey();
    keyPair = generateKeyPair();
  });

  describe('Symmetric Encryption', () => {
    let capsule: SecureCapsule;

    beforeEach(() => {
      capsule = new SecureCapsule({
        mode: 'symmetric',
        secretKey,
      });
    });

    test('should encrypt and decrypt strings', () => {
      const plaintext = 'Hello, World!';
      const encrypted = capsule.encrypt(plaintext);
      const decrypted = capsule.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    test('should encrypt and decrypt objects', () => {
      const plaintext = { message: 'Hello, World!', number: 42, array: [1, 2, 3] };
      const encrypted = capsule.encrypt(plaintext);
      const decrypted = capsule.decrypt(encrypted);

      expect(decrypted).toEqual(plaintext);
      expect(encrypted).not.toEqual(plaintext);
    });

    test('should produce different ciphertexts for same input', () => {
      const plaintext = 'Hello, World!';
      const encrypted1 = capsule.encrypt(plaintext);
      const encrypted2 = capsule.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(capsule.decrypt(encrypted1)).toBe(plaintext);
      expect(capsule.decrypt(encrypted2)).toBe(plaintext);
    });

    test('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = capsule.encrypt(plaintext);
      const decrypted = capsule.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    test('should handle large data', () => {
      const plaintext = 'x'.repeat(10000);
      const encrypted = capsule.encrypt(plaintext);
      const decrypted = capsule.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    test('should throw error with invalid secret key', () => {
      expect(() => {
        new SecureCapsule({
          mode: 'symmetric',
          secretKey: 'invalid-key',
        });
      }).toThrow();
    });
  });

  describe('Asymmetric Encryption', () => {
    let capsule: SecureCapsule;

    beforeEach(() => {
      capsule = new SecureCapsule({
        mode: 'asymmetric',
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
      });
    });

    test('should encrypt and decrypt strings', () => {
      const plaintext = 'Hello, World!';
      const encrypted = capsule.encrypt(plaintext);
      const decrypted = capsule.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    test('should encrypt and decrypt objects', () => {
      const plaintext = { message: 'Hello, World!', number: 42 };
      const encrypted = capsule.encrypt(plaintext);
      const decrypted = capsule.decrypt(encrypted);

      expect(decrypted).toEqual(plaintext);
    });

    test('should handle large data with chunking', () => {
      const plaintext = 'x'.repeat(1000);
      const encrypted = capsule.encrypt(plaintext);
      const decrypted = capsule.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    test('should throw error with missing keys', () => {
      expect(() => {
        new SecureCapsule({
          mode: 'asymmetric',
          publicKey: keyPair.publicKey,
          // Missing private key
        });
      }).toThrow();
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const capsule = new SecureCapsule({
        mode: 'symmetric',
        secretKey,
      });

      const newKeyPair = generateKeyPair();
      capsule.updateConfig({
        mode: 'asymmetric',
        publicKey: newKeyPair.publicKey,
        privateKey: newKeyPair.privateKey,
      });

      const config = capsule.getConfig();
      expect(config.mode).toBe('asymmetric');
    });

    test('should get sanitized configuration', () => {
      const capsule = new SecureCapsule({
        mode: 'symmetric',
        secretKey,
      });

      const config = capsule.getConfig();
      expect(config).not.toHaveProperty('secretKey');
      expect(config).not.toHaveProperty('publicKey');
      expect(config).not.toHaveProperty('privateKey');
      expect(config.mode).toBe('symmetric');
    });
  });

  describe('Detailed Encryption/Decryption', () => {
    test('should provide detailed encryption result', () => {
      const capsule = new SecureCapsule({
        mode: 'symmetric',
        secretKey,
      });

      const plaintext = 'Hello, World!';
      const result = capsule.encryptDetailed(plaintext);

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('algorithm');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');

      const decrypted = capsule.decryptDetailed(result);
      expect(decrypted.data).toBe(plaintext);
    });
  });
});
