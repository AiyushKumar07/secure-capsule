import { createSecureMiddleware, createDecryptMiddleware } from '../src/middleware/express';
import { generateSecretKey } from '../src/utils/environment';
import { SecureCapsule } from '../src/core/SecureCapsule';

// Mock Express types
interface MockRequest {
  body?: any;
  get?: (header: string) => string | undefined;
}

interface MockResponse {
  json: jest.Mock;
  setHeader: jest.Mock;
  status: jest.Mock;
  secure?: jest.Mock;
}

describe('Express Middleware', () => {
  let secretKey: string;
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    secretKey = generateSecretKey();
    mockReq = {
      body: {},
      get: jest.fn(),
    };
    
    // Create proper mock functions
    mockRes = {
      json: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn(),
    };
    
    // Make the mocks chainable
    mockRes.json.mockReturnValue(mockRes);
    mockRes.setHeader.mockReturnValue(mockRes);
    mockRes.status.mockReturnValue(mockRes);
    
    mockNext = jest.fn();
  });

  describe('Secure Middleware', () => {
    test('should encrypt response automatically', () => {
      const middleware = createSecureMiddleware({
        mode: 'symmetric',
        secretKey,
        autoEncrypt: true,
      });

      // Execute middleware
      middleware(mockReq as any, mockRes as any, mockNext);

      // Test that res.json was overridden
      const testData = { message: 'Hello, World!' };
      mockRes.json(testData);

      // Verify encryption header was set
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Encrypted', 'true');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');

      // Verify the response was encrypted
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          encrypted: expect.any(String),
        })
      );
    });

    test('should provide res.secure method', () => {
      const middleware = createSecureMiddleware({
        mode: 'symmetric',
        secretKey,
      });

      // Execute middleware
      middleware(mockReq as any, mockRes as any, mockNext);

      // Test res.secure method
      expect((mockRes as any).secure).toBeDefined();
      expect(typeof (mockRes as any).secure).toBe('function');

      const testData = { message: 'Hello, World!' };
      (mockRes as any).secure(testData);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Encrypted', 'true');
    });

    test('should not encrypt when autoEncrypt is false', () => {
      const middleware = createSecureMiddleware({
        mode: 'symmetric',
        secretKey,
        autoEncrypt: false,
      });

      // Execute middleware
      middleware(mockReq as any, mockRes as any, mockNext);

      const testData = { message: 'Hello, World!' };
      mockRes.json(testData);

      // Verify response was not encrypted
      expect(mockRes.json).toHaveBeenCalledWith(testData);
      expect(mockRes.setHeader).not.toHaveBeenCalledWith('X-Encrypted', 'true');
    });

    test('should call next middleware', () => {
      const middleware = createSecureMiddleware({
        mode: 'symmetric',
        secretKey,
      });

      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Decrypt Middleware', () => {
    test('should decrypt incoming encrypted requests', () => {
      const capsule = new SecureCapsule({ mode: 'symmetric', secretKey });
      const testData = { message: 'Hello, World!' };
      const encrypted = capsule.encrypt(testData);

      mockReq.body = { encrypted };
      mockReq.get = jest.fn().mockReturnValue('true'); // X-Encrypted header

      const middleware = createDecryptMiddleware({
        mode: 'symmetric',
        secretKey,
      });

      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.body).toEqual(testData);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle non-encrypted requests', () => {
      const testData = { message: 'Hello, World!' };
      mockReq.body = testData;
      mockReq.get = jest.fn().mockReturnValue(undefined); // No encryption header

      const middleware = createDecryptMiddleware({
        mode: 'symmetric',
        secretKey,
      });

      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.body).toEqual(testData);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle decryption errors', () => {
      mockReq.body = { encrypted: 'invalid-encrypted-data' };
      mockReq.get = jest.fn().mockReturnValue('true'); // X-Encrypted header

      const middleware = createDecryptMiddleware({
        mode: 'symmetric',
        secretKey,
      });

      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to decrypt request data' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Integration Test', () => {
    test('should encrypt and decrypt round trip', () => {
      const originalData = { message: 'Hello, World!', number: 42 };

      // Simulate request/response cycle
      const encryptMiddleware = createSecureMiddleware({
        mode: 'symmetric',
        secretKey,
        autoEncrypt: true,
      });

      const decryptMiddleware = createDecryptMiddleware({
        mode: 'symmetric',
        secretKey,
      });

      // Execute encrypt middleware
      encryptMiddleware(mockReq as any, mockRes as any, mockNext);

      // Capture encrypted response
      let encryptedResponse: any;
      mockRes.json = jest.fn().mockImplementation((data) => {
        encryptedResponse = data;
        return mockRes;
      });

      (mockRes as any).json(originalData);

      // Simulate the encrypted response being sent as next request
      const newMockReq: MockRequest = {
        body: encryptedResponse,
        get: jest.fn().mockReturnValue('true'),
      };

      const newMockNext = jest.fn();

      // Execute decrypt middleware
      decryptMiddleware(newMockReq as any, mockRes as any, newMockNext);

      expect(newMockReq.body).toEqual(originalData);
      expect(newMockNext).toHaveBeenCalled();
    });
  });
});
