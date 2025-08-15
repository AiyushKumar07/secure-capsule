import { SecureCapsuleConfig, EncryptionResult, DecryptionResult } from '../types';
import { loadEnvironmentConfig, validateKeys } from '../utils/environment';
import { 
  encryptSymmetric, 
  decryptSymmetric, 
  encryptSymmetricForTransmission, 
  decryptSymmetricFromTransmission 
} from '../symmetric/aes';
import { 
  encryptAsymmetric, 
  decryptAsymmetric, 
  encryptAsymmetricForTransmission, 
  decryptAsymmetricFromTransmission,
  generateKeyPair 
} from '../asymmetric/rsa';

/**
 * Main SecureCapsule class for encryption and decryption
 */
export class SecureCapsule {
  private config: SecureCapsuleConfig;
  
  constructor(config?: Partial<SecureCapsuleConfig>) {
    // Load environment configuration
    const envConfig = loadEnvironmentConfig();
    
    // Set default configuration
    this.config = {
      mode: 'symmetric',
      algorithm: 'AES-256-GCM',
      ...config,
    };
    
    // Auto-configure from environment if keys not provided
    if (!this.config.secretKey && !this.config.publicKey && !this.config.privateKey) {
      if (this.config.mode === 'symmetric' && envConfig.SECURE_KEY) {
        this.config.secretKey = envConfig.SECURE_KEY;
      } else if (this.config.mode === 'asymmetric' && envConfig.PUBLIC_KEY && envConfig.PRIVATE_KEY) {
        this.config.publicKey = envConfig.PUBLIC_KEY;
        this.config.privateKey = envConfig.PRIVATE_KEY;
      }
    }
    
    // Validate configuration
    this.validateConfig();
  }
  
  /**
   * Validate the current configuration
   */
  private validateConfig(): void {
    if (this.config.mode === 'symmetric') {
      if (!this.config.secretKey) {
        throw new Error('Secret key is required for symmetric mode. Set SECURE_KEY in .env or provide secretKey in config.');
      }
    } else if (this.config.mode === 'asymmetric') {
      if (!this.config.publicKey || !this.config.privateKey) {
        throw new Error('Public and private keys are required for asymmetric mode. Set PUBLIC_KEY and PRIVATE_KEY in .env or provide them in config.');
      }
    }
  }
  
  /**
   * Encrypt data based on the configured mode
   */
  encrypt(data: string | object): string {
    if (this.config.mode === 'symmetric') {
      return encryptSymmetricForTransmission(data, this.config.secretKey!);
    } else {
      return encryptAsymmetricForTransmission(data, this.config.publicKey!);
    }
  }
  
  /**
   * Decrypt data based on the configured mode
   */
  decrypt(cipherText: string): any {
    if (this.config.mode === 'symmetric') {
      return decryptSymmetricFromTransmission(cipherText, this.config.secretKey!);
    } else {
      return decryptAsymmetricFromTransmission(cipherText, this.config.privateKey!);
    }
  }
  
  /**
   * Get detailed encryption result (not base64 encoded)
   */
  encryptDetailed(data: string | object): EncryptionResult {
    if (this.config.mode === 'symmetric') {
      return encryptSymmetric(data, this.config.secretKey!);
    } else {
      return encryptAsymmetric(data, this.config.publicKey!);
    }
  }
  
  /**
   * Decrypt detailed encryption result
   */
  decryptDetailed(encryptionResult: EncryptionResult): DecryptionResult {
    if (this.config.mode === 'symmetric') {
      return decryptSymmetric(encryptionResult, this.config.secretKey!);
    } else {
      return decryptAsymmetric(encryptionResult, this.config.privateKey!);
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<SecureCapsuleConfig>): void {
    this.config = { ...this.config, ...config };
    this.validateConfig();
  }
  
  /**
   * Get current configuration (without sensitive keys)
   */
  getConfig(): Omit<SecureCapsuleConfig, 'secretKey' | 'publicKey' | 'privateKey'> {
    return {
      mode: this.config.mode,
      algorithm: this.config.algorithm,
    };
  }
  
  /**
   * Generate new RSA key pair (only for asymmetric mode)
   */
  static generateKeyPair() {
    return generateKeyPair();
  }
}
