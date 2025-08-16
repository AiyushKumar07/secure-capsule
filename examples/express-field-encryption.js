/**
 * Express middleware field-level encryption example
 * Shows how to use the new fieldEncryption option in Express
 * Run with: node examples/express-field-encryption.js
 */

const express = require('express');
const { createSecureMiddleware, createDecryptMiddleware, generateSecretKey } = require('../dist');

console.log('🔐 Express Field-Level Encryption Demo\n');

// Generate a secret key
const secretKey = generateSecretKey();
console.log('Using secret key:', secretKey.substring(0, 20) + '...\n');

const app = express();
app.use(express.json());

// Middleware with field-level encryption enabled
app.use(createSecureMiddleware({
  mode: 'symmetric',
  secretKey,
  fieldEncryption: true,    // Enable field-level encryption
  paddingFields: 2,         // Add 2 padding fields for extra obfuscation
  autoEncrypt: true
}));

// Middleware to decrypt incoming field-encrypted requests
app.use(createDecryptMiddleware({
  mode: 'symmetric',
  secretKey,
  fieldEncryption: true,
  paddingFields: 2
}));

// API endpoint that returns user data
app.get('/api/user/:id', (req, res) => {
  // This response will be automatically field-encrypted
  res.json({
    userId: parseInt(req.params.id),
    username: 'john_doe',
    email: 'john@example.com',
    role: 'admin',
    lastLogin: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      notifications: true
    }
  });
});

// API endpoint for creating a user
app.post('/api/user', (req, res) => {
  // req.body is automatically decrypted if it was field-encrypted
  console.log('Received user data:', req.body);
  
  // Response will be field-encrypted
  res.json({
    success: true,
    message: 'User created successfully',
    userId: Math.floor(Math.random() * 10000),
    createdAt: new Date().toISOString()
  });
});

// Standard endpoint without field encryption (for comparison)
app.get('/api/standard/:id', (req, res) => {
  // Temporarily disable auto-encryption for this response
  const originalJson = res.json;
  res.json = originalJson.bind(res);
  
  res.json({
    message: 'This is NOT encrypted',
    userId: parseInt(req.params.id),
    timestamp: new Date().toISOString()
  });
});

// Manual field encryption using res.secure()
app.get('/api/secure/:id', (req, res) => {
  const userData = {
    userId: parseInt(req.params.id),
    sensitiveData: 'This is highly confidential',
    securityLevel: 'TOP_SECRET'
  };
  
  // Use res.secure() for explicit field-level encryption
  res.secure(userData);
});

// Simulate the server for demo purposes
console.log('🚀 Simulating API responses...\n');

// Simulate getting user data
const mockRequest = { params: { id: '123' } };
const mockResponse = {
  json: function(data) {
    console.log('📤 API Response (Field-Encrypted):');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📍 Notice how:');
    console.log('  • Field names are randomized (e.g., "hVYaqR", "xJzCabI")');
    console.log('  • Each value is individually encrypted');
    console.log('  • Structure looks like a normal JSON response');
    console.log('  • Extra padding fields are added for obfuscation');
    console.log('  • "encrypted: true" and "timestamp" metadata included');
    console.log('  • "_mapping" contains encrypted field name mappings\n');
    return this;
  },
  setHeader: function() { return this; }
};

// Simulate the middleware encryption
const middleware = createSecureMiddleware({
  mode: 'symmetric',
  secretKey,
  fieldEncryption: true,
  paddingFields: 2,
  autoEncrypt: true
});

// Run the middleware simulation
middleware(mockRequest, mockResponse, () => {
  // Simulate the route handler
  mockResponse.json({
    userId: 123,
    username: 'john_doe',
    email: 'john@example.com',
    role: 'admin',
    balance: 1500.50
  });
});

console.log('💡 To use in your Express app:');
console.log(`
// Enable field-level encryption
app.use(createSecureMiddleware({
  secretKey: '${secretKey}',
  fieldEncryption: true,     // Enable field-level encryption
  paddingFields: 2,          // Add padding fields
  autoEncrypt: true
}));

// Your routes will automatically return field-encrypted responses
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello', data: 'World' });
  // Returns: { "hVYaqR": "encrypted_hello", "xJzCabI": "encrypted_world", encrypted: true, ... }
});
`);

console.log('✨ Field-level encryption in Express complete!');
