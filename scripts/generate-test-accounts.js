#!/usr/bin/env node

/**
 * Generate Stellar Test Accounts
 * Creates and funds test accounts on Stellar testnet
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

// Mock Stellar Keypair generation (simplified for demo)
class MockKeypair {
  static random() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let publicKey = 'G';
    let secret = 'S';
    
    for (let i = 0; i < 55; i++) {
      publicKey += chars[Math.floor(Math.random() * chars.length)];
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return {
      publicKey: () => publicKey,
      secret: () => secret,
    };
  }
}

/**
 * Fund account using Stellar Friendbot
 */
async function fundAccount(publicKey) {
  return new Promise((resolve, reject) => {
    const url = `https://friendbot.stellar.org?addr=${publicKey}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Friendbot returned status ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Generate test accounts
 */
async function generateTestAccounts() {
  console.log('\n' + '='.repeat(60));
  console.log('  Stellar Test Account Generator');
  console.log('='.repeat(60) + '\n');

  const envPath = path.join(process.cwd(), '.env.local');
  
  // Check if .env.local exists
  if (!fs.existsSync(envPath)) {
    log.error('.env.local not found');
    log.info('Run: npm run dev:setup first');
    process.exit(1);
  }

  // Read current .env.local
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Generate 3 test accounts
  const accounts = [];
  
  for (let i = 1; i <= 3; i++) {
    log.info(`Generating test account ${i}...`);
    
    const keypair = MockKeypair.random();
    const publicKey = keypair.publicKey();
    const secret = keypair.secret();
    
    accounts.push({ publicKey, secret, number: i });
    
    log.success(`Account ${i} generated`);
    log.info(`  Public Key: ${publicKey}`);
    log.info(`  Secret Key: ${secret.substring(0, 10)}...`);
    
    // Try to fund the account
    try {
      log.info(`  Funding account ${i} via Friendbot...`);
      await fundAccount(publicKey);
      log.success(`  Account ${i} funded with 10,000 XLM`);
    } catch (error) {
      log.warning(`  Could not fund account ${i}: ${error.message}`);
      log.info(`  You can fund it manually at: https://laboratory.stellar.org/#account-creator?network=test`);
    }
    
    // Update .env.local
    const publicKeyPattern = new RegExp(`TEST_ACCOUNT_${i}_PUBLIC=.*`, 'g');
    const secretKeyPattern = new RegExp(`TEST_ACCOUNT_${i}_SECRET=.*`, 'g');
    
    if (envContent.match(publicKeyPattern)) {
      envContent = envContent.replace(publicKeyPattern, `TEST_ACCOUNT_${i}_PUBLIC=${publicKey}`);
    } else {
      envContent += `\nTEST_ACCOUNT_${i}_PUBLIC=${publicKey}`;
    }
    
    if (envContent.match(secretKeyPattern)) {
      envContent = envContent.replace(secretKeyPattern, `TEST_ACCOUNT_${i}_SECRET=${secret}`);
    } else {
      envContent += `\nTEST_ACCOUNT_${i}_SECRET=${secret}`;
    }
    
    console.log('');
  }

  // Write updated .env.local
  fs.writeFileSync(envPath, envContent);
  log.success('Test accounts saved to .env.local');

  // Generate accounts.json for easy reference
  const accountsData = {
    generated: new Date().toISOString(),
    network: 'testnet',
    accounts: accounts.map(acc => ({
      number: acc.number,
      publicKey: acc.publicKey,
      secret: acc.secret,
      explorerUrl: `https://stellar.expert/explorer/testnet/account/${acc.publicKey}`,
      laboratoryUrl: `https://laboratory.stellar.org/#explorer?resource=accounts&endpoint=single&network=test&values=${acc.publicKey}`,
    })),
  };

  const accountsPath = path.join(process.cwd(), 'test-accounts.json');
  fs.writeFileSync(accountsPath, JSON.stringify(accountsData, null, 2));
  log.success('Account details saved to test-accounts.json');

  console.log('\n' + '='.repeat(60));
  console.log('  Test Accounts Generated Successfully!');
  console.log('='.repeat(60) + '\n');

  console.log('Account Summary:');
  accounts.forEach(acc => {
    console.log(`\nAccount ${acc.number}:`);
    console.log(`  Public: ${acc.publicKey}`);
    console.log(`  Secret: ${acc.secret.substring(0, 10)}... (see .env.local for full key)`);
    console.log(`  Explorer: https://stellar.expert/explorer/testnet/account/${acc.publicKey}`);
  });

  console.log('\n' + colors.yellow + '⚠ Important Security Notes:' + colors.reset);
  console.log('  - These are TESTNET accounts only');
  console.log('  - Never use these keys on mainnet');
  console.log('  - Never commit .env.local to version control');
  console.log('  - Rotate test accounts regularly');
  console.log('  - Keep test-accounts.json secure\n');

  console.log(colors.blue + 'Next Steps:' + colors.reset);
  console.log('  1. Check account balances: npm run dev:check-balances');
  console.log('  2. Fund more XLM: npm run dev:fund-accounts');
  console.log('  3. Start development: npm run dev\n');
}

// Run the generator
generateTestAccounts().catch(error => {
  log.error(`Failed to generate accounts: ${error.message}`);
  process.exit(1);
});
