/**
 * Express middleware field-level encryption simulation
 * Shows exactly what the field encryption produces without requiring Express
 * Run with: node examples/middleware-simulation.js
 */

const { createSecureMiddleware, generateSecretKey, SecureCapsule } = require('../dist');

console.log('🔐 Field-Level Encryption Middleware Simulation\n');

// Generate a secret key
const secretKey = generateSecretKey();
console.log('Using secret key:', secretKey.substring(0, 20) + '...\n');

// Sample API response data
const apiResponseData = {
  message: "Hello, World!",
  userId: 12345,
  email: "user@example.com",
  role: "admin"
};

console.log('📤 Original API Response:');
console.log(JSON.stringify(apiResponseData, null, 2));
console.log('\n');

// === STANDARD ENCRYPTION (Current Approach) ===
console.log('🔒 STANDARD ENCRYPTION (Current Approach)');
console.log('==========================================');

const capsule = new SecureCapsule({ mode: 'symmetric', secretKey });
const standardEncrypted = {
  encrypted: capsule.encrypt(apiResponseData),
  timestamp: new Date().toISOString()
};

console.log('Standard encrypted response:');
console.log(JSON.stringify(standardEncrypted, null, 2));
console.log('\n');

// === FIELD-LEVEL ENCRYPTION (New Approach) ===
console.log('🎯 FIELD-LEVEL ENCRYPTION (New Approach)');
console.log('=========================================');

const fieldEncrypted = capsule.encryptFields(apiResponseData);

console.log('Field-level encrypted response:');
console.log(JSON.stringify(fieldEncrypted, null, 2));
console.log('\n');

// === WITH PADDING FIELDS ===
console.log('🎭 FIELD-LEVEL WITH PADDING (Maximum Obfuscation)');
console.log('=================================================');

const fieldEncryptedWithPadding = capsule.encryptFieldsWithPadding(apiResponseData, 3);

console.log('Field-level encrypted with padding:');
console.log(JSON.stringify(fieldEncryptedWithPadding, null, 2));
console.log('\n');

// === DECRYPTION TEST ===
console.log('🔓 DECRYPTION TEST');
console.log('==================');

const decryptedStandard = capsule.decrypt(standardEncrypted.encrypted);
const decryptedField = capsule.decryptFields(fieldEncrypted);
const decryptedPadded = capsule.decryptFieldsIgnorePadding(fieldEncryptedWithPadding);

console.log('Decrypted standard:', JSON.stringify(decryptedStandard));
console.log('Decrypted field:', JSON.stringify(decryptedField));
console.log('Decrypted padded:', JSON.stringify(decryptedPadded));

console.log('\nAll match original?', 
  JSON.stringify(apiResponseData) === JSON.stringify(decryptedStandard) &&
  JSON.stringify(apiResponseData) === JSON.stringify(decryptedField) &&
  JSON.stringify(apiResponseData) === JSON.stringify(decryptedPadded) ? '✅' : '❌'
);

console.log('\n');

// === ANALYSIS ===
console.log('📊 ANALYSIS');
console.log('===========');

const originalSize = JSON.stringify(apiResponseData).length;
const standardSize = JSON.stringify(standardEncrypted).length;
const fieldSize = JSON.stringify(fieldEncrypted).length;
const paddedSize = JSON.stringify(fieldEncryptedWithPadding).length;

console.log(`Original response size: ${originalSize} characters`);
console.log(`Standard encrypted size: ${standardSize} characters (${((standardSize/originalSize-1)*100).toFixed(1)}% larger)`);
console.log(`Field encrypted size: ${fieldSize} characters (${((fieldSize/originalSize-1)*100).toFixed(1)}% larger)`);
console.log(`Field + padding size: ${paddedSize} characters (${((paddedSize/originalSize-1)*100).toFixed(1)}% larger)`);

console.log('\n📈 Field Count Analysis:');
console.log(`Original fields: ${Object.keys(apiResponseData).length}`);
console.log(`Standard encrypted fields: ${Object.keys(standardEncrypted).length}`);
console.log(`Field encrypted fields: ${Object.keys(fieldEncrypted).length - 3} data + 3 metadata`);
console.log(`Field + padding fields: ${Object.keys(fieldEncryptedWithPadding).length - 3} data + 3 metadata (includes ${Object.keys(fieldEncryptedWithPadding).length - 3 - Object.keys(apiResponseData).length} padding)`);

console.log('\n🔍 Security Benefits:');
console.log('  ✅ Standard: Entire payload encrypted, but structure is obvious');
console.log('  ✅ Field-level: Each field encrypted separately, field names obfuscated');
console.log('  ✅ With padding: Extra dummy fields make real data count unclear');

console.log('\n💡 When to use which approach:');
console.log('  🏃 Standard: Fastest performance, good security');
console.log('  🎯 Field-level: Better obfuscation, response looks "normal"');
console.log('  🎭 With padding: Maximum security, harder to analyze patterns');

console.log('\n✨ Field-level encryption simulation complete!');
