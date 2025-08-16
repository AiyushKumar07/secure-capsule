import * as crypto from 'crypto';
import { SecureCapsule } from './SecureCapsule';
import { FieldEncryptionResult } from '../types';

/**
 * Field mapping for encryption/decryption
 */
interface FieldMapping {
  [originalField: string]: string | NestedFieldMapping; // original -> obfuscated or nested mapping
}

/**
 * Nested field mapping structure
 */
interface NestedFieldMapping {
  _field: string;
  _nested: FieldMapping;
}

/**
 * Field-level encryption class
 */
export class FieldEncryption {
  private capsule: SecureCapsule;

  constructor(capsule: SecureCapsule) {
    this.capsule = capsule;
  }

  /**
   * Generate a random field name
   */
  private generateRandomFieldName(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const length = Math.floor(Math.random() * 8) + 6; // 6-13 characters
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if a value is a plain object (not array, null, or primitive)
   */
  private isPlainObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
  }

  /**
   * Recursively encrypt nested object structure
   */
  private encryptNestedObject(data: Record<string, any>, mapping: FieldMapping): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [originalField, value] of Object.entries(data)) {
      // Skip undefined values as they can't be properly encrypted
      if (value === undefined) {
        continue;
      }
      
      const obfuscatedField = this.generateRandomFieldName();
      
      if (this.isPlainObject(value)) {
        // Recursively handle nested objects
        const nestedMapping: FieldMapping = {};
        result[obfuscatedField] = this.encryptNestedObject(value, nestedMapping);
        mapping[originalField] = {
          _field: obfuscatedField,
          _nested: nestedMapping
        };
      } else {
        // Encrypt primitive values, arrays, and dates
        const encryptedValue = this.capsule.encrypt(value);
        result[obfuscatedField] = encryptedValue;
        mapping[originalField] = obfuscatedField;
      }
    }

    return result;
  }

  /**
   * Recursively decrypt nested object structure
   */
  private decryptNestedObject(encryptedData: Record<string, any>, mapping: FieldMapping): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [originalField, mappingValue] of Object.entries(mapping)) {
      if (typeof mappingValue === 'object' && '_field' in mappingValue && '_nested' in mappingValue) {
        // Handle nested object
        const nestedMapping = mappingValue as NestedFieldMapping;
        const obfuscatedField = nestedMapping._field;
        const nestedFieldMapping = nestedMapping._nested;
        const nestedEncryptedData = encryptedData[obfuscatedField];
        
        if (nestedEncryptedData && this.isPlainObject(nestedEncryptedData)) {
          result[originalField] = this.decryptNestedObject(nestedEncryptedData, nestedFieldMapping);
        }
      } else if (typeof mappingValue === 'string') {
        // Handle primitive value
        const obfuscatedField = mappingValue;
        const encryptedValue = encryptedData[obfuscatedField];
        
        if (typeof encryptedValue === 'string') {
          result[originalField] = this.capsule.decrypt(encryptedValue);
        }
      }
    }

    return result;
  }

  /**
   * Encrypt object with field-level encryption and obfuscated field names
   */
  encryptFields(data: Record<string, any>): FieldEncryptionResult {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('Field encryption requires a plain object');
    }

    const mapping: FieldMapping = {};
    const encryptedData = this.encryptNestedObject(data, mapping);

    const result: FieldEncryptionResult = {
      encrypted: true,
      timestamp: new Date().toISOString(),
      ...encryptedData
    };

    // Encrypt the mapping itself and store it
    result._mapping = this.capsule.encrypt(mapping);

    return result;
  }

  /**
   * Decrypt field-level encrypted object
   */
  decryptFields(encryptedData: FieldEncryptionResult): Record<string, any> {
    if (!encryptedData.encrypted || !encryptedData._mapping) {
      throw new Error('Invalid field-encrypted data structure');
    }

    // Decrypt the field mapping
    const mapping: FieldMapping = this.capsule.decrypt(encryptedData._mapping);
    
    // Extract the data part (excluding metadata)
    const { encrypted, timestamp, _mapping, ...dataOnly } = encryptedData;
    
    // Recursively decrypt the nested structure
    return this.decryptNestedObject(dataOnly, mapping);
  }

  /**
   * Encrypt with additional randomization and padding
   */
  encryptFieldsWithPadding(data: Record<string, any>, paddingFields: number = 2): FieldEncryptionResult {
    const result = this.encryptFields(data);

    // Add padding fields with random data to further obfuscate
    for (let i = 0; i < paddingFields; i++) {
      const paddingField = this.generateRandomFieldName();
      const randomData = Math.random().toString(36).substring(2, 15);
      result[paddingField] = this.capsule.encrypt(randomData);
    }

    return result;
  }

  /**
   * Decrypt with automatic padding field detection
   */
  decryptFieldsIgnorePadding(encryptedData: FieldEncryptionResult): Record<string, any> {
    // This now works the same as decryptFields since the recursive approach
    // only decrypts fields that exist in the mapping, automatically ignoring padding
    return this.decryptFields(encryptedData);
  }
}
