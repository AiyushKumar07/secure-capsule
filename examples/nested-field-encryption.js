/**
 * Nested field-level encryption example
 * Demonstrates how nested objects are handled with obfuscated field names at each level
 * Run with: node examples/nested-field-encryption.js
 */

const { SecureCapsule, generateSecretKey } = require('../dist');

console.log('🔐 Nested Field-Level Encryption Example\n');

// Generate a secret key
const secretKey = generateSecretKey();
const capsule = new SecureCapsule({
  mode: 'symmetric',
  secretKey
});

// Example 1: Simple Nested Object
console.log('1. Simple Nested Object');
console.log('=======================');

const simpleNestedData = {
  user: {
    name: "John Doe",
    email: "john@example.com"
  },
  settings: {
    theme: "dark",
    notifications: true
  }
};

console.log('Original nested data:');
console.log(JSON.stringify(simpleNestedData, null, 2));

const simpleEncrypted = capsule.encryptFields(simpleNestedData);
console.log('\nField-encrypted (with nested structure preserved):');
console.log(JSON.stringify(simpleEncrypted, null, 2));

const simpleDecrypted = capsule.decryptFields(simpleEncrypted);
console.log('\nDecrypted back to original:');
console.log(JSON.stringify(simpleDecrypted, null, 2));
console.log('Match:', JSON.stringify(simpleNestedData) === JSON.stringify(simpleDecrypted) ? '✅' : '❌');

console.log('\n' + '='.repeat(50) + '\n');

// Example 2: Deeply Nested Object
console.log('2. Deeply Nested Object');
console.log('=======================');

const deeplyNestedData = {
  message: "API Response",
  user: {
    id: 12345,
    profile: {
      personal: {
        firstName: "John",
        lastName: "Doe",
        age: 30
      },
      contact: {
        email: "john@example.com",
        phone: "+1-555-0123"
      }
    },
    preferences: {
      ui: {
        theme: "dark",
        language: "en"
      },
      notifications: {
        email: true,
        push: false,
        sms: true
      }
    }
  },
  metadata: {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    server: {
      region: "us-east-1",
      instance: "i-abc123def456"
    }
  }
};

console.log('Original deeply nested data:');
console.log(JSON.stringify(deeplyNestedData, null, 2));

const deepEncrypted = capsule.encryptFields(deeplyNestedData);
console.log('\nField-encrypted (nested structure preserved):');
console.log(JSON.stringify(deepEncrypted, null, 2));

const deepDecrypted = capsule.decryptFields(deepEncrypted);
console.log('\nDecrypted back to original:');
console.log(JSON.stringify(deepDecrypted, null, 2));
console.log('Match:', JSON.stringify(deeplyNestedData) === JSON.stringify(deepDecrypted) ? '✅' : '❌');

console.log('\n' + '='.repeat(50) + '\n');

// Example 3: Mixed Data Types
console.log('3. Mixed Data Types (Arrays, Dates, etc.)');
console.log('=========================================');

const mixedData = {
  message: "Complex data structure",
  numbers: [1, 2, 3, 4, 5],
  createdAt: new Date(),
  config: {
    enabled: true,
    maxRetries: 3,
    servers: ["server1", "server2", "server3"],
    database: {
      host: "db.example.com",
      port: 5432,
      credentials: {
        username: "admin",
        password: "secret123"
      }
    }
  },
  nullValue: null,
  undefinedValue: undefined
};

console.log('Original mixed data:');
console.log(JSON.stringify(mixedData, null, 2));

const mixedEncrypted = capsule.encryptFields(mixedData);
console.log('\nField-encrypted (preserving arrays and other types):');
console.log(JSON.stringify(mixedEncrypted, null, 2));

const mixedDecrypted = capsule.decryptFields(mixedEncrypted);
console.log('\nDecrypted back to original:');
console.log(JSON.stringify(mixedDecrypted, null, 2));

// Note: undefined values are lost in JSON serialization, so we exclude them from comparison
const originalForComparison = JSON.parse(JSON.stringify(mixedData));
console.log('Match:', JSON.stringify(originalForComparison) === JSON.stringify(mixedDecrypted) ? '✅' : '❌');

console.log('\n' + '='.repeat(50) + '\n');

// Example 4: Express API Response Simulation
console.log('4. Express API Response Simulation');
console.log('==================================');

const apiResponse = {
  success: true,
  message: "User data retrieved successfully",
  data: {
    user: {
      id: 12345,
      username: "johndoe",
      profile: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        avatar: "https://example.com/avatars/johndoe.jpg"
      },
      account: {
        balance: 1500.50,
        currency: "USD",
        tier: "premium",
        permissions: ["read", "write", "admin"]
      }
    },
    session: {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresAt: "2025-08-15T12:00:00Z",
      refreshToken: "refresh_token_here"
    }
  },
  meta: {
    requestId: "req_123456",
    processingTime: 150,
    server: {
      instance: "api-server-01",
      region: "us-east-1"
    }
  }
};

console.log('Original API response:');
console.log(JSON.stringify(apiResponse, null, 2));

console.log('\n🔒 Field-encrypted API response:');
const encryptedApiResponse = capsule.encryptFields(apiResponse);
console.log(JSON.stringify(encryptedApiResponse, null, 2));

console.log('\n🔓 Decrypted API response:');
const decryptedApiResponse = capsule.decryptFields(encryptedApiResponse);
console.log(JSON.stringify(decryptedApiResponse, null, 2));
console.log('Match:', JSON.stringify(apiResponse) === JSON.stringify(decryptedApiResponse) ? '✅' : '❌');

console.log('\n' + '='.repeat(50) + '\n');

// Example 5: Size and Performance Analysis
console.log('5. Size and Performance Analysis');
console.log('===============================');

const testData = deeplyNestedData;
const originalSize = JSON.stringify(testData).length;

// Standard encryption
const standardStart = process.hrtime.bigint();
const standardEncrypted = { encrypted: capsule.encrypt(testData) };
const standardEnd = process.hrtime.bigint();
const standardTime = Number(standardEnd - standardStart) / 1000000;
const standardSize = JSON.stringify(standardEncrypted).length;

// Nested field encryption  
const nestedStart = process.hrtime.bigint();
const nestedEncrypted = capsule.encryptFields(testData);
const nestedEnd = process.hrtime.bigint();
const nestedTime = Number(nestedEnd - nestedStart) / 1000000;
const nestedSize = JSON.stringify(nestedEncrypted).length;

console.log('📊 Size Comparison:');
console.log(`Original: ${originalSize} characters`);
console.log(`Standard encrypted: ${standardSize} characters (${((standardSize/originalSize-1)*100).toFixed(1)}% larger)`);
console.log(`Nested field encrypted: ${nestedSize} characters (${((nestedSize/originalSize-1)*100).toFixed(1)}% larger)`);

console.log('\n⚡ Performance Comparison:');
console.log(`Standard encryption: ${standardTime.toFixed(2)} ms`);
console.log(`Nested field encryption: ${nestedTime.toFixed(2)} ms (${((nestedTime/standardTime-1)*100).toFixed(1)}% slower)`);

console.log('\n🔍 Structure Analysis:');
function countFields(obj, prefix = '') {
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    count++;
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      count += countFields(value, prefix + key + '.');
    }
  }
  return count;
}

const originalFieldCount = countFields(testData);
const encryptedFieldCount = countFields(nestedEncrypted) - 3; // Subtract metadata fields
console.log(`Original total fields: ${originalFieldCount}`);
console.log(`Encrypted total fields: ${encryptedFieldCount} (including obfuscated names)`);

console.log('\n✨ Nested field-level encryption examples completed!');
console.log('\n🎯 Benefits of Nested Field Encryption:');
console.log('  • Preserves object structure while encrypting individual fields');
console.log('  • Obfuscates field names at every nesting level');
console.log('  • Handles complex nested objects, arrays, and mixed data types');
console.log('  • Response structure appears normal to attackers');
console.log('  • Compatible with existing APIs and middleware');
