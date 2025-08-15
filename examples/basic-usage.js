/**
 * Basic usage example for Secure Capsule
 * Run with: node examples/basic-usage.js
 */

const { SecureCapsule, generateSecretKey, generateKeyPair } = require('../dist');

console.log('🔐 Secure Capsule Examples\n');

// Example 1: Symmetric Encryption
console.log('1. Symmetric Encryption (AES-256-GCM)');
console.log('=====================================');

const secretKey = generateSecretKey();
console.log('Generated secret key:', secretKey.substring(0, 20) + '...');

const symmetricCapsule = new SecureCapsule({
  mode: 'symmetric',
  secretKey
});

const dataToEncrypt = {
  message: 'Hello, Secure World!',
  userId: 12345,
  roles: ['admin', 'user'],
  timestamp: new Date().toISOString()
};

console.log('Original data:', dataToEncrypt);

const encrypted = symmetricCapsule.encrypt(dataToEncrypt);
console.log('Encrypted (first 50 chars):', encrypted.substring(0, 50) + '...');

const decrypted = symmetricCapsule.decrypt(encrypted);
console.log('Decrypted data:', decrypted);
console.log('Match:', JSON.stringify(dataToEncrypt) === JSON.stringify(decrypted) ? '✅' : '❌');

console.log('\n');

// Example 2: Asymmetric Encryption
console.log('2. Asymmetric Encryption (RSA-2048)');
console.log('===================================');

const keyPair = generateKeyPair();
console.log('Generated key pair (public key first 50 chars):', keyPair.publicKey.substring(0, 50) + '...');

const asymmetricCapsule = new SecureCapsule({
  mode: 'asymmetric',
  publicKey: keyPair.publicKey,
  privateKey: keyPair.privateKey
});

const secretMessage = 'This is a secret message that only the private key holder can read!';
console.log('Original message:', secretMessage);

const encryptedMessage = asymmetricCapsule.encrypt(secretMessage);
console.log('Encrypted (first 50 chars):', encryptedMessage.substring(0, 50) + '...');

const decryptedMessage = asymmetricCapsule.decrypt(encryptedMessage);
console.log('Decrypted message:', decryptedMessage);
console.log('Match:', secretMessage === decryptedMessage ? '✅' : '❌');

console.log('\n');

// Example 3: Large Data Handling
console.log('3. Large Data Handling');
console.log('======================');

const largeData = {
  content: 'x'.repeat(1000), // 1KB of data
  metadata: {
    size: 1000,
    type: 'text/plain',
    created: new Date()
  }
};

console.log('Large data size:', JSON.stringify(largeData).length, 'characters');

const encryptedLarge = symmetricCapsule.encrypt(largeData);
console.log('Encrypted size:', encryptedLarge.length, 'characters');

const decryptedLarge = symmetricCapsule.decrypt(encryptedLarge);
console.log('Decryption successful:', decryptedLarge.content.length === 1000 ? '✅' : '❌');

console.log('\n');

// Example 4: Performance Comparison
console.log('4. Performance Comparison');
console.log('========================');

const testData = { message: 'Performance test data', value: 42 };

// Symmetric encryption performance
const symStart = process.hrtime.bigint();
for (let i = 0; i < 1000; i++) {
  const enc = symmetricCapsule.encrypt(testData);
  symmetricCapsule.decrypt(enc);
}
const symEnd = process.hrtime.bigint();
const symTime = Number(symEnd - symStart) / 1000000; // Convert to milliseconds

// Asymmetric encryption performance
const asymStart = process.hrtime.bigint();
for (let i = 0; i < 100; i++) { // Fewer iterations due to slower performance
  const enc = asymmetricCapsule.encrypt(testData);
  asymmetricCapsule.decrypt(enc);
}
const asymEnd = process.hrtime.bigint();
const asymTime = Number(asymEnd - asymStart) / 1000000; // Convert to milliseconds

console.log('Symmetric (1000 iterations):', symTime.toFixed(2), 'ms');
console.log('Asymmetric (100 iterations):', asymTime.toFixed(2), 'ms');
console.log('Symmetric is', (asymTime * 10 / symTime).toFixed(1), 'x faster');

console.log('\n✨ All examples completed successfully!');
