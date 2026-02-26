#!/usr/bin/env node

/**
 * Fund Stellar Test Accounts
 * Funds existing test accounts using Stellar Friendbot
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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
 * Get account balance
 */
async function getAccountBalance(publicKey) {
  return new Promise((resolve, reject) => {
    const url = `https://horizon-testnet.stellar.org/accounts/${publicKey}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const account = JSON.parse(data);
          const xlmBalance = account.balances.find(b => b.asset_type === 'native');
          resolve(xlmBalance ? parseFloat(xlmBalance.balance) : 0);
        } else if (res.statusCode === 404) {
          resolve(0); // Account doesn't exist yet
        } else {
          reject(new Error(`Horizon returned status ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Load test accounts from .env.local
 */
function loadTestAccounts() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log.error('.env.local not found');
    log.info('Run: npm run dev:setup first');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const accounts = [];

  for (let i = 1; i <= 3; i++) {
    const publicKeyMatch = envContent.match(new RegExp(`TEST_ACCOUNT_${i}_PUBLIC=(.+)`));
    
    if (publicKeyMatch && publicKeyMatch[1] && publicKeyMatch[1].trim()) {
      accounts.push({
        number: i,
        publicKey: publicKeyMatch[1].trim(),
      });
    }
  }

  return accounts;
}

/**
 * Main function
 */
async function fundTestAccounts() {
  console.log('\n' + '='.repeat(60));
  console.log('  Stellar Test Account Funding');
  console.log('='.repeat(60) + '\n');

  const accounts = loadTestAccounts();

  if (accounts.length === 0) {
    log.error('No test accounts found in .env.local');
    log.info('Run: npm run dev:generate-accounts first');
    process.exit(1);
  }

  log.info(`Found ${accounts.length} test account(s)\n`);

  for (const account of accounts) {
    console.log(`Account ${account.number}: ${account.publicKey}`);
    
    try {
      // Check current balance
      log.info('  Checking current balance...');
      const balance = await getAccountBalance(account.publicKey);
      
      if (balance > 0) {
        log.success(`  Current balance: ${balance.toFixed(2)} XLM`);
        
        if (balance < 100) {
          log.warning('  Balance is low, funding account...');
          await fundAccount(account.publicKey);
          const newBalance = await getAccountBalance(account.publicKey);
          log.success(`  Account funded! New balance: ${newBalance.toFixed(2)} XLM`);
        } else {
          log.info('  Balance is sufficient, skipping funding');
        }
      } else {
        log.info('  Account not yet created, funding...');
        await fundAccount(account.publicKey);
        const newBalance = await getAccountBalance(account.publicKey);
        log.success(`  Account created and funded! Balance: ${newBalance.toFixed(2)} XLM`);
      }
    } catch (error) {
      log.error(`  Failed to fund account: ${error.message}`);
      log.info(`  You can fund manually at: https://laboratory.stellar.org/#account-creator?network=test`);
    }
    
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('  Funding Complete!');
  console.log('='.repeat(60) + '\n');

  console.log(colors.blue + 'Account Status:' + colors.reset);
  for (const account of accounts) {
    try {
      const balance = await getAccountBalance(account.publicKey);
      console.log(`  Account ${account.number}: ${balance.toFixed(2)} XLM`);
    } catch (error) {
      console.log(`  Account ${account.number}: Error checking balance`);
    }
  }

  console.log('\n' + colors.blue + 'Useful Links:' + colors.reset);
  console.log('  Stellar Laboratory: https://laboratory.stellar.org/');
  console.log('  Stellar Expert: https://stellar.expert/explorer/testnet');
  console.log('  Friendbot: https://laboratory.stellar.org/#account-creator?network=test\n');
}

// Run the funding script
fundTestAccounts().catch(error => {
  log.error(`Failed to fund accounts: ${error.message}`);
  process.exit(1);
});
