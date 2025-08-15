import * as crypto from 'crypto';
import { EncryptionResult, DecryptionResult, KeyPair } from '../types';

const RSA_KEY_SIZE = 2048;
const RSA_ALGORITHM = 'rsa';
const HASH_ALGORITHM = 'sha256';

/**
 * Generate RSA key pair
 */
export function generateKeyPair(): KeyPair {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: RSA_KEY_SIZE,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      publicKey: Buffer.from(publicKey).toString('base64'),
      privateKey: Buffer.from(privateKey).toString('base64'),
    };
  } catch (error) {
    throw new Error(`Key pair generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt data using RSA public key
 */
export function encryptAsymmetric(data: string | object, publicKey: string): EncryptionResult {
  try {
    // Convert data to JSON string if it's an object
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Convert base64 key back to PEM format
    const publicKeyPem = Buffer.from(publicKey, 'base64').toString('utf8');
    
    // For large data, we need to split it into chunks since RSA can only encrypt limited data
    const maxChunkSize = (RSA_KEY_SIZE / 8) - 42; // OAEP padding overhead
    const chunks: string[] = [];
    
    for (let i = 0; i < plaintext.length; i += maxChunkSize) {
      const chunk = plaintext.slice(i, i + maxChunkSize);
      const encryptedChunk = crypto.publicEncrypt(
        {
          key: publicKeyPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: HASH_ALGORITHM,
        },
        Buffer.from(chunk, 'utf8')
      );
      chunks.push(encryptedChunk.toString('base64'));
    }
    
    return {
      ciphertext: JSON.stringify(chunks),
      algorithm: 'RSA-OAEP',
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new Error(`Asymmetric encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data using RSA private key
 */
export function decryptAsymmetric(encryptionResult: EncryptionResult, privateKey: string): DecryptionResult {
  try {
    // Convert base64 key back to PEM format
    const privateKeyPem = Buffer.from(privateKey, 'base64').toString('utf8');
    
    // Parse chunks from ciphertext
    const chunks: string[] = JSON.parse(encryptionResult.ciphertext);
    let plaintext = '';
    
    for (const chunk of chunks) {
      const decryptedChunk = crypto.privateDecrypt(
        {
          key: privateKeyPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: HASH_ALGORITHM,
        },
        Buffer.from(chunk, 'base64')
      );
      plaintext += decryptedChunk.toString('utf8');
    }
    
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
    throw new Error(`Asymmetric decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sign data using RSA private key
 */
export function signData(data: string, privateKey: string): string {
  try {
    const privateKeyPem = Buffer.from(privateKey, 'base64').toString('utf8');
    const signature = crypto.sign(HASH_ALGORITHM, Buffer.from(data, 'utf8'), {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    });
    return signature.toString('base64');
  } catch (error) {
    throw new Error(`Data signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify signature using RSA public key
 */
export function verifySignature(data: string, signature: string, publicKey: string): boolean {
  try {
    const publicKeyPem = Buffer.from(publicKey, 'base64').toString('utf8');
    return crypto.verify(
      HASH_ALGORITHM,
      Buffer.from(data, 'utf8'),
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      },
      Buffer.from(signature, 'base64')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Encrypt data and return base64 encoded result for easy transmission
 */
export function encryptAsymmetricForTransmission(data: string | object, publicKey: string): string {
  const result = encryptAsymmetric(data, publicKey);
  return Buffer.from(JSON.stringify(result)).toString('base64');
}

/**
 * Decrypt base64 encoded data from transmission
 */
export function decryptAsymmetricFromTransmission(encodedData: string, privateKey: string): any {
  try {
    const encryptionResult = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'));
    const result = decryptAsymmetric(encryptionResult, privateKey);
    return result.data;
  } catch (error) {
    throw new Error(`Failed to decrypt transmission data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
