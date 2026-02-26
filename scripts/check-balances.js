#!/usr/bin/env node

/**
 * Check Stellar Test Account Balances
 * Displays current balances for all test accounts
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
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

/**
 * Get account details from Horizon
 */
async function getAccountDetails(publicKey) {
  return new Promise((resolve, reject) => {
    const url = `https://horizon-testnet.stellar.org/accounts/${publicKey}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else if (res.statusCode === 404) {
          resolve(null); // Account doesn't exist
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
 * Format balance display
 */
function formatBalance(balance) {
  const num = parseFloat(balance);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Main function
 */
async function checkBalances() {
  console.log('\n' + '='.repeat(70));
  console.log('  Stellar Test Account Balances');
  console.log('='.repeat(70) + '\n');

  const accounts = loadTestAccounts();

  if (accounts.length === 0) {
    log.error('No test accounts found in .env.local');
    log.info('Run: npm run dev:generate-accounts first');
    process.exit(1);
  }

  log.info(`Checking ${accounts.length} account(s)...\n`);

  let totalXLM = 0;
  const accountDetails = [];

  for (const account of accounts) {
    try {
      const details = await getAccountDetails(account.publicKey);
      
      if (!details) {
        console.log(`${colors.yellow}Account ${account.number}${colors.reset}: ${account.publicKey}`);
        log.warning('  Account not yet created on testnet');
        log.info('  Run: npm run dev:fund-accounts\n');
        continue;
      }

      // Parse balances
      const balances = details.balances;
      const xlmBalance = balances.find(b => b.asset_type === 'native');
      const xlmAmount = xlmBalance ? parseFloat(xlmBalance.balance) : 0;
      totalXLM += xlmAmount;

      // Get other assets
      const otherAssets = balances.filter(b => b.asset_type !== 'native');

      accountDetails.push({
        number: account.number,
        publicKey: account.publicKey,
        xlm: xlmAmount,
        assets: otherAssets,
        subentries: details.subentry_count,
        sequence: details.sequence,
      });

      // Display account info
      console.log(`${colors.cyan}Account ${account.number}${colors.reset}: ${account.publicKey}`);
      console.log(`  ${colors.green}XLM Balance:${colors.reset} ${formatBalance(xlmAmount)} XLM`);
      
      if (otherAssets.length > 0) {
        console.log(`  ${colors.blue}Other Assets:${colors.reset}`);
        otherAssets.forEach(asset => {
          const code = asset.asset_code;
          const balance = formatBalance(asset.balance);
          console.log(`    - ${balance} ${code}`);
        });
      }
      
      console.log(`  ${colors.blue}Subentries:${colors.reset} ${details.subentry_count}`);
      console.log(`  ${colors.blue}Sequence:${colors.reset} ${details.sequence}`);
      console.log(`  ${colors.blue}Explorer:${colors.reset} https://stellar.expert/explorer/testnet/account/${account.publicKey}`);
      console.log('');

    } catch (error) {
      console.log(`${colors.red}Account ${account.number}${colors.reset}: ${account.publicKey}`);
      log.error(`  Failed to fetch account: ${error.message}\n`);
    }
  }

  // Summary
  console.log('='.repeat(70));
  console.log('  Summary');
  console.log('='.repeat(70) + '\n');

  console.log(`${colors.cyan}Total Accounts:${colors.reset} ${accountDetails.length}`);
  console.log(`${colors.green}Total XLM:${colors.reset} ${formatBalance(totalXLM)} XLM`);
  console.log(`${colors.blue}Average Balance:${colors.reset} ${formatBalance(totalXLM / accountDetails.length)} XLM per account\n`);

  // Warnings
  const lowBalanceAccounts = accountDetails.filter(a => a.xlm < 100);
  if (lowBalanceAccounts.length > 0) {
    log.warning(`${lowBalanceAccounts.length} account(s) have low balance (< 100 XLM)`);
    log.info('Run: npm run dev:fund-accounts\n');
  }

  // Useful links
  console.log('='.repeat(70));
  console.log('  Useful Links');
  console.log('='.repeat(70) + '\n');
  console.log('  Stellar Laboratory: https://laboratory.stellar.org/');
  console.log('  Stellar Expert: https://stellar.expert/explorer/testnet');
  console.log('  Friendbot: https://laboratory.stellar.org/#account-creator?network=test');
  console.log('');
}

// Run the script
checkBalances().catch(error => {
  log.error(`Failed to check balances: ${error.message}`);
  process.exit(1);
});
