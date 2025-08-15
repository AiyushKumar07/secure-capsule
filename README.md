# Secure Capsule 🔐

A universal encryption library for full-stack JavaScript that can secure entire API responses and individual values with minimal setup.

## Features

- **Universal**: Works in both Node.js (backend) and browsers (frontend)
- **Simple API**: Just `encrypt()` and `decrypt()` functions
- **Multiple Modes**: Symmetric (AES-256-GCM) and Asymmetric (RSA-2048+) encryption
- **Express Middleware**: Automatic API response encryption
- **Environment-based**: Configure with `.env` files
- **Tamper Protection**: Built-in authentication tags and signatures
- **TypeScript Support**: Full type definitions included

## Installation

```bash
npm install secure-capsule
```

## Quick Start

### Basic Usage (Symmetric)

```javascript
import { SecureCapsule } from 'secure-capsule';

// Initialize with a secret key
const capsule = new SecureCapsule({
  mode: 'symmetric',
  secretKey: 'your-base64-encoded-secret-key'
});

// Encrypt data
const encrypted = capsule.encrypt({ message: 'Hello, World!' });

// Decrypt data
const decrypted = capsule.decrypt(encrypted);
console.log(decrypted); // { message: 'Hello, World!' }
```

### Environment Configuration

Create a `.env` file:

```env
SECURE_KEY="base64encodedkey"
# For asymmetric mode:
# PUBLIC_KEY="base64encodedpublickey"
# PRIVATE_KEY="base64encodedprivatekey"
```

Then use without explicit configuration:

```javascript
import { SecureCapsule } from 'secure-capsule';

// Automatically loads from .env
const capsule = new SecureCapsule();
const encrypted = capsule.encrypt('sensitive data');
```

## API Reference

### Core Class

#### `new SecureCapsule(config?)`

Creates a new SecureCapsule instance.

**Parameters:**
- `config` (optional): Configuration object
  - `mode`: `'symmetric'` | `'asymmetric'` (default: `'symmetric'`)
  - `secretKey`: Base64-encoded secret key (for symmetric mode)
  - `publicKey`: Base64-encoded public key (for asymmetric mode)
  - `privateKey`: Base64-encoded private key (for asymmetric mode)
  - `algorithm`: `'AES-256-GCM'` | `'RSA-OAEP'` (auto-selected based on mode)

#### `encrypt(data: string | object): string`

Encrypts data and returns a base64-encoded string safe for transmission.

#### `decrypt(cipherText: string): any`

Decrypts data and returns the original value.

### Express Middleware

#### Automatic Response Encryption

```javascript
import express from 'express';
import { createSecureMiddleware } from 'secure-capsule';

const app = express();

// Apply middleware globally
app.use(createSecureMiddleware({
  mode: 'symmetric',
  secretKey: process.env.SECURE_KEY,
  autoEncrypt: true
}));

app.get('/api/data', (req, res) => {
  // This response will be automatically encrypted
  res.json({ sensitive: 'data' });
});

// Or use res.secure() for explicit encryption
app.get('/api/secure', (req, res) => {
  res.secure({ message: 'This is encrypted' });
});
```

#### Request Decryption

```javascript
import { createDecryptMiddleware } from 'secure-capsule';

// Automatically decrypt incoming encrypted requests
app.use(createDecryptMiddleware({
  mode: 'symmetric',
  secretKey: process.env.SECURE_KEY
}));

app.post('/api/data', (req, res) => {
  // req.body is automatically decrypted if encrypted
  console.log(req.body);
});
```

### Frontend Usage (Browser)

```javascript
import { decryptResponse, fetchSecure } from 'secure-capsule';

// Decrypt API responses
const response = await fetch('/api/data');
const data = await response.json();
const decrypted = await decryptResponse(data, {
  key: 'your-secret-key'
});

// Or use the convenience function
const data = await fetchSecure('/api/data', {
  method: 'GET',
  decryptKey: 'your-secret-key'
});
```

## Examples

### Symmetric Encryption (Recommended for most use cases)

```javascript
import { SecureCapsule, generateSecretKey } from 'secure-capsule';

// Generate a new secret key
const secretKey = generateSecretKey();
console.log('Save this key:', secretKey);

const capsule = new SecureCapsule({
  mode: 'symmetric',
  secretKey
});

// Encrypt various data types
const encryptedString = capsule.encrypt('Hello, World!');
const encryptedObject = capsule.encrypt({
  userId: 123,
  email: 'user@example.com',
  roles: ['admin', 'user']
});

// Decrypt
console.log(capsule.decrypt(encryptedString)); // 'Hello, World!'
console.log(capsule.decrypt(encryptedObject)); // { userId: 123, ... }
```

### Asymmetric Encryption (For secure key sharing)

```javascript
import { SecureCapsule } from 'secure-capsule';

// Generate key pair
const keyPair = SecureCapsule.generateKeyPair();

// Sender (encrypts with public key)
const senderCapsule = new SecureCapsule({
  mode: 'asymmetric',
  publicKey: keyPair.publicKey,
  privateKey: keyPair.privateKey // Only needed for decryption
});

// Receiver (decrypts with private key)
const receiverCapsule = new SecureCapsule({
  mode: 'asymmetric',
  publicKey: keyPair.publicKey,
  privateKey: keyPair.privateKey
});

const encrypted = senderCapsule.encrypt('Secret message');
const decrypted = receiverCapsule.decrypt(encrypted);
```

### Full-Stack Example

**Backend (Express)**

```javascript
import express from 'express';
import { createSecureMiddleware } from 'secure-capsule';

const app = express();

app.use(express.json());
app.use(createSecureMiddleware({
  mode: 'symmetric',
  autoEncrypt: true
}));

app.get('/api/user/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  // Response is automatically encrypted
  res.json(user);
});

app.listen(3000);
```

**Frontend (React/Vanilla JS)**

```javascript
import { fetchSecure } from 'secure-capsule';

async function fetchUser(id) {
  try {
    const userData = await fetchSecure(`/api/user/${id}`, {
      method: 'GET',
      decryptKey: process.env.REACT_APP_SECURE_KEY
    });
    return userData;
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
}
```

## Security Features

### Tamper Protection

- **AES-GCM**: Provides built-in authentication tags to detect tampering
- **RSA Signatures**: Optional signature verification for asymmetric mode
- **Timestamp Validation**: Each encrypted payload includes a timestamp

### Key Management

```javascript
import { generateSecretKey, generateKeyPair } from 'secure-capsule';

// Generate symmetric key
const secretKey = generateSecretKey();

// Generate asymmetric key pair
const { publicKey, privateKey } = generateKeyPair();

// Store securely in .env
console.log(`SECURE_KEY="${secretKey}"`);
console.log(`PUBLIC_KEY="${publicKey}"`);
console.log(`PRIVATE_KEY="${privateKey}"`);
```

## Configuration Options

### Environment Variables

```env
# Symmetric mode
SECURE_KEY="base64encodedkey"

# Asymmetric mode
PUBLIC_KEY="base64encodedpublickey"
PRIVATE_KEY="base64encodedprivatekey"
```

### Middleware Options

```javascript
const middlewareOptions = {
  mode: 'symmetric',           // 'symmetric' | 'asymmetric'
  secretKey: 'key',           // For symmetric mode
  publicKey: 'pubkey',        // For asymmetric mode
  privateKey: 'privkey',      // For asymmetric mode
  autoEncrypt: true,          // Auto-encrypt all responses
  encryptedHeader: 'X-Encrypted' // Header to indicate encrypted content
};
```

## Error Handling

```javascript
import { SecureCapsule } from 'secure-capsule';

try {
  const capsule = new SecureCapsule({
    mode: 'symmetric',
    secretKey: 'invalid-key'
  });
} catch (error) {
  console.error('Configuration error:', error.message);
}

try {
  const decrypted = capsule.decrypt('invalid-data');
} catch (error) {
  console.error('Decryption error:', error.message);
}
```

## Performance Considerations

- **Symmetric encryption** is significantly faster and recommended for most use cases
- **Asymmetric encryption** has size limitations (~190 bytes per chunk) and is slower
- Large data is automatically chunked in asymmetric mode
- Use compression before encryption for large payloads

## Testing

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues and questions, please use the GitHub issue tracker.
