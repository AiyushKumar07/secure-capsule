/**
 * Field-level encryption example for Secure Capsule
 * Demonstrates obfuscated field names and individual field encryption
 * Run with: node examples/field-encryption.js
 */

const { SecureCapsule, generateSecretKey } = require('../dist');

console.log('🔐 Field-Level Encryption Example\n');

// Generate a secret key
const secretKey = generateSecretKey();
const capsule = new SecureCapsule({
  mode: 'symmetric',
  secretKey
});

// Example 1: Basic Field Encryption
console.log('1. Basic Field Encryption');
console.log('=======================');

const originalData = {
  message: "Hello, World!",
  userId: 12345,
  email: "user@example.com",
  role: "admin"
};

console.log('Original data:', originalData);

// Encrypt with field-level encryption
const fieldEncrypted = capsule.encryptFields(originalData);
console.log('\nField-encrypted result:');
console.log(JSON.stringify(fieldEncrypted, null, 2));

// Notice how:
// - Each field has a random obfuscated name
// - Each value is individually encrypted
// - The response includes metadata (encrypted: true, timestamp, _mapping)

// Decrypt back to original
const decrypted = capsule.decryptFields(fieldEncrypted);
console.log('\nDecrypted back to original:');
console.log(decrypted);
console.log('Match:', JSON.stringify(originalData) === JSON.stringify(decrypted) ? '✅' : '❌');

console.log('\n');

// Example 2: Field Encryption with Padding
console.log('2. Field Encryption with Padding (Extra Obfuscation)');
console.log('================================================');

const userData = {
  username: "john_doe",
  balance: 1500.50,
  permissions: ["read", "write"]
};

console.log('Original user data:', userData);

// Encrypt with padding fields for extra obfuscation
const paddedEncrypted = capsule.encryptFieldsWithPadding(userData, 3);
console.log('\nField-encrypted with padding:');
console.log(JSON.stringify(paddedEncrypted, null, 2));

// Notice how there are more fields than the original (padding fields)
const originalFieldCount = Object.keys(userData).length;
const encryptedFieldCount = Object.keys(paddedEncrypted).length - 3; // -3 for metadata
console.log(`\nOriginal fields: ${originalFieldCount}`);
console.log(`Encrypted fields: ${encryptedFieldCount} (includes ${encryptedFieldCount - originalFieldCount} padding fields)`);

// Decrypt ignoring padding
const decryptedWithPadding = capsule.decryptFieldsIgnorePadding(paddedEncrypted);
console.log('\nDecrypted (padding ignored):');
console.log(decryptedWithPadding);
console.log('Match:', JSON.stringify(userData) === JSON.stringify(decryptedWithPadding) ? '✅' : '❌');

console.log('\n');

// Example 3: Express Middleware Style Response
console.log('3. Express Middleware Style Response');
console.log('==================================');

// This simulates what the Express middleware would return
function simulateExpressResponse(data, useFieldEncryption = false, paddingFields = 0) {
  if (useFieldEncryption) {
    if (paddingFields > 0) {
      return capsule.encryptFieldsWithPadding(data, paddingFields);
    } else {
      return capsule.encryptFields(data);
    }
  } else {
    // Standard encryption (what you currently have)
    return {
      encrypted: capsule.encrypt(data),
      timestamp: new Date().toISOString()
    };
  }
}

const apiData = {
  success: true,
  data: {
    orderId: "ORD-12345",
    amount: 99.99,
    status: "completed"
  },
  message: "Order processed successfully"
};

console.log('Original API response:');
console.log(JSON.stringify(apiData, null, 2));

console.log('\nStandard encryption (current approach):');
const standardEncrypted = simulateExpressResponse(apiData, false);
console.log(JSON.stringify(standardEncrypted, null, 2));

console.log('\nField-level encryption (new approach):');
const fieldLevelEncrypted = simulateExpressResponse(apiData, true, 2);
console.log(JSON.stringify(fieldLevelEncrypted, null, 2));

console.log('\n');

// Example 4: Performance Comparison
console.log('4. Performance Comparison');
console.log('========================');

const testData = {
  field1: "test data 1",
  field2: "test data 2",
  field3: 42,
  field4: true,
  field5: { nested: "object" }
};

// Standard encryption performance
const standardStart = process.hrtime.bigint();
for (let i = 0; i < 1000; i++) {
  const enc = capsule.encrypt(testData);
  capsule.decrypt(enc);
}
const standardEnd = process.hrtime.bigint();
const standardTime = Number(standardEnd - standardStart) / 1000000;

// Field encryption performance
const fieldStart = process.hrtime.bigint();
for (let i = 0; i < 1000; i++) {
  const enc = capsule.encryptFields(testData);
  capsule.decryptFields(enc);
}
const fieldEnd = process.hrtime.bigint();
const fieldTime = Number(fieldEnd - fieldStart) / 1000000;

console.log('Standard encryption (1000 iterations):', standardTime.toFixed(2), 'ms');
console.log('Field encryption (1000 iterations):', fieldTime.toFixed(2), 'ms');
console.log('Performance impact:', ((fieldTime / standardTime - 1) * 100).toFixed(1), '% slower');

console.log('\n✨ Field-level encryption examples completed!');
console.log('\n🔍 Benefits of Field-Level Encryption:');
console.log('  • Individual fields are encrypted separately');
console.log('  • Field names are obfuscated with random strings');
console.log('  • Response structure looks normal to attackers');
console.log('  • Optional padding fields add extra obfuscation');
console.log('  • Compatible with existing Express middleware');
