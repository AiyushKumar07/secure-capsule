import { Request, Response, NextFunction } from 'express';
import { SecureCapsule } from '../core/SecureCapsule';
import { MiddlewareOptions } from '../types';

/**
 * Express middleware for automatic response encryption
 */
export function createSecureMiddleware(options: MiddlewareOptions = {}) {
  // Create SecureCapsule instance
  const capsule = new SecureCapsule({
    mode: options.mode || 'symmetric',
    secretKey: options.secretKey,
    publicKey: options.publicKey,
  });
  
  return function secureMiddleware(req: Request, res: Response, next: NextFunction) {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override res.json to encrypt responses
    res.json = function(obj: any) {
      if (options.autoEncrypt !== false) {
        try {
          const encrypted = capsule.encrypt(obj);
          
          // Set header to indicate encrypted content
          res.setHeader(options.encryptedHeader || 'X-Encrypted', 'true');
          res.setHeader('Content-Type', 'application/json');
          
          return originalJson({ encrypted });
        } catch (error) {
          console.error('Encryption error:', error);
          // Fallback to original response in case of encryption error
          return originalJson(obj);
        }
      } else {
        return originalJson(obj);
      }
    };
    
    // Add secure method to response object
    (res as any).secure = function(obj: any) {
      try {
        const encrypted = capsule.encrypt(obj);
        res.setHeader(options.encryptedHeader || 'X-Encrypted', 'true');
        res.setHeader('Content-Type', 'application/json');
        return originalJson({ encrypted });
      } catch (error) {
        console.error('Encryption error:', error);
        throw error;
      }
    };
    
    next();
  };
}

/**
 * Convenience function to create symmetric middleware
 */
export function createSymmetricMiddleware(secretKey?: string, autoEncrypt: boolean = true) {
  return createSecureMiddleware({
    mode: 'symmetric',
    secretKey,
    autoEncrypt,
  });
}

/**
 * Convenience function to create asymmetric middleware
 */
export function createAsymmetricMiddleware(publicKey?: string, autoEncrypt: boolean = true) {
  return createSecureMiddleware({
    mode: 'asymmetric',
    publicKey,
    autoEncrypt,
  });
}

/**
 * Middleware to decrypt incoming encrypted requests
 */
export function createDecryptMiddleware(options: MiddlewareOptions = {}) {
  const capsule = new SecureCapsule({
    mode: options.mode || 'symmetric',
    secretKey: options.secretKey,
    publicKey: options.publicKey,
  });
  
  return function decryptMiddleware(req: Request, res: Response, next: NextFunction) {
    // Check if request has encrypted data
    const hasEncryptedHeader = req.get(options.encryptedHeader || 'X-Encrypted') === 'true';
    
    if (hasEncryptedHeader && req.body && req.body.encrypted) {
      try {
        const decrypted = capsule.decrypt(req.body.encrypted);
        req.body = decrypted;
      } catch (error) {
        console.error('Decryption error:', error);
        return res.status(400).json({ error: 'Failed to decrypt request data' });
      }
    }
    
    next();
  };
}
