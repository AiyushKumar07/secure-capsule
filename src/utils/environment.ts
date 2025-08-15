import * as dotenv from 'dotenv';
import { EnvironmentConfig } from '../types';

/**
 * Load environment configuration from .env file
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  // Load .env file if it exists
  dotenv.config();
  
  return {
    SECURE_KEY: process.env.SECURE_KEY,
    PUBLIC_KEY: process.env.PUBLIC_KEY,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
  };
}

/**
 * Validate that required keys are present for the specified mode
 */
export function validateKeys(mode: 'symmetric' | 'asymmetric', config: EnvironmentConfig): boolean {
  if (mode === 'symmetric') {
    return !!config.SECURE_KEY;
  } else {
    return !!(config.PUBLIC_KEY && config.PRIVATE_KEY);
  }
}

/**
 * Generate a random base64 encoded key for symmetric encryption
 */
export function generateSecretKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Convert base64 key to buffer
 */
export function keyToBuffer(key: string): Buffer {
  try {
    const buffer = Buffer.from(key, 'base64');
    if (buffer.length !== 32) {
      throw new Error('Invalid key length. Expected 32 bytes for AES-256.');
    }
    return buffer;
  } catch (error) {
    throw new Error(`Invalid base64 key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert buffer to base64 key
 */
export function bufferToKey(buffer: Buffer): string {
  return buffer.toString('base64');
}
