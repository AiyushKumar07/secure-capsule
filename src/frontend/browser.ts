import { FrontendDecryptOptions } from '../types';

/**
 * Browser-compatible encryption utilities using WebCrypto API
 */

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binaryString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}

/**
 * Import AES-GCM key from base64 string
 */
async function importAESKey(base64Key: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM in the browser
 */
export async function encryptBrowser(data: string | object, secretKey: string): Promise<string> {
  try {
    // Convert data to JSON string if it's an object
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const plaintextBuffer = new TextEncoder().encode(plaintext);
    
    // Import the key
    const key = await importAESKey(secretKey);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(16));
    
    // Encrypt
    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        additionalData: new TextEncoder().encode('secure-capsule'),
      },
      key,
      plaintextBuffer
    );
    
    // Combine IV and ciphertext
    const result = {
      ciphertext: arrayBufferToBase64(cipherBuffer.slice(0, -16)), // Remove auth tag
      algorithm: 'aes-256-gcm',
      iv: arrayBufferToBase64(iv.buffer),
      authTag: arrayBufferToBase64(cipherBuffer.slice(-16)), // Last 16 bytes are auth tag
      timestamp: Date.now(),
    };
    
    // Return base64 encoded result
    return btoa(JSON.stringify(result));
  } catch (error) {
    throw new Error(`Browser encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data using AES-GCM in the browser
 */
export async function decryptBrowser(encryptedData: string, secretKey: string): Promise<any> {
  try {
    // Parse the encrypted data
    const encryptionResult = JSON.parse(atob(encryptedData));
    
    // Import the key
    const key = await importAESKey(secretKey);
    
    // Convert data back to ArrayBuffers
    const iv = base64ToArrayBuffer(encryptionResult.iv);
    const ciphertext = base64ToArrayBuffer(encryptionResult.ciphertext);
    const authTag = base64ToArrayBuffer(encryptionResult.authTag);
    
    // Combine ciphertext and auth tag
    const combinedBuffer = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
    combinedBuffer.set(new Uint8Array(ciphertext), 0);
    combinedBuffer.set(new Uint8Array(authTag), ciphertext.byteLength);
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
        additionalData: new TextEncoder().encode('secure-capsule'),
      },
      key,
      combinedBuffer
    );
    
    // Convert back to string
    const plaintext = new TextDecoder().decode(decryptedBuffer);
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(plaintext);
    } catch {
      return plaintext;
    }
  } catch (error) {
    throw new Error(`Browser decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt response from API (convenience function)
 */
export async function decryptResponse(response: any, options: FrontendDecryptOptions): Promise<any> {
  if (response && response.encrypted) {
    return await decryptBrowser(response.encrypted, options.key);
  }
  return response;
}

/**
 * Fetch and decrypt API response
 */
export async function fetchSecure(url: string, options: RequestInit & { decryptKey: string }): Promise<any> {
  const { decryptKey, ...fetchOptions } = options;
  
  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    // Check if response is encrypted
    if (response.headers.get('X-Encrypted') === 'true' && data.encrypted) {
      return await decryptBrowser(data.encrypted, decryptKey);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Secure fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a random secret key for symmetric encryption (browser-compatible)
 */
export async function generateSecretKeyBrowser(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}
