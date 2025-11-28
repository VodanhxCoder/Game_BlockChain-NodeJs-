/**
 * Comprehensive wallet linking tool using Sequelize
 * Supports multiple operations: link, unlink, list, verify
 * Usage: node manage-wallets.cjs <command> [args]
 */

const db = require('./src/models');
const { Sequelize } = require('sequelize');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Validate Ethereum address format
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Link a wallet to a user
async function linkWallet(username, walletAddress) {
  try {
    log(`\n🔗 Linking wallet to user...`, 'cyan');
    
    // Validate wallet address
    if (!isValidAddress(walletAddress)) {
      log('❌ Invalid wallet address format!', 'red');
      log('   Expected: 0x followed by 40 hexadecimal characters', 'yellow');
      log(`   Received: ${walletAddress}`, 'yellow');
      return false;
    }

    // Find user
    const user = await db.User.findOne({ where: { username } });
    if (!user) {
      log(`❌ User "${username}" not found in database`, 'red');
      return false;
    }

    // Check if wallet is already linked to another user
    const existingWallet = await db.User.findOne({ 
      where: { walletAddress },
      attributes: ['username', 'walletAddress']
    });
    
    if (existingWallet && existingWallet.username !== username) {
      log(`❌ Wallet is already linked to user "${existingWallet.username}"`, 'red');
      log('   Each wallet can only be linked to one user', 'yellow');
      return false;
    }

    // Check if user already has a different wallet
    if (user.walletAddress && user.walletAddress !== walletAddress) {
      log(`⚠️  User "${username}" already has wallet: ${user.walletAddress}`, 'yellow');
      log('   Replacing with new wallet address...', 'yellow');
    }

    // Update user's wallet address
    await user.update({ walletAddress });

    log('✅ Successfully linked wallet!', 'green');
    log(`   Username: ${username}`, 'cyan');
    log(`   Wallet:   ${walletAddress}`, 'cyan');
    return true;

  } catch (error) {
    log(`❌ Error linking wallet: ${error.message}`, 'red');
    if (error.name === 'SequelizeUniqueConstraintError') {
      log('   This wallet address is already in use', 'yellow');
    }
    return false;
  }
}

// Unlink wallet from user
async function unlinkWallet(username) {
  try {
    log(`\n🔓 Unlinking wallet from user...`, 'cyan');

    const user = await db.User.findOne({ where: { username } });
    if (!user) {
      log(`❌ User "${username}" not found`, 'red');
      return false;
    }

    if (!user.walletAddress) {
      log(`⚠️  User "${username}" has no wallet linked`, 'yellow');
      return false;
    }

    const oldWallet = user.walletAddress;
    await user.update({ walletAddress: null });

    log('✅ Successfully unlinked wallet!', 'green');
    log(`   Username: ${username}`, 'cyan');
    log(`   Removed:  ${oldWallet}`, 'cyan');
    return true;

  } catch (error) {
    log(`❌ Error unlinking wallet: ${error.message}`, 'red');
    return false;
  }
}

// List all users with linked wallets
async function listWallets() {
  try {
    log('\n📋 Users with linked wallets:', 'cyan');

    const users = await db.User.findAll({
      where: {
        walletAddress: { [Sequelize.Op.ne]: null }
      },
      attributes: ['username', 'playername', 'walletAddress', 'createdAt'],
      order: [['username', 'ASC']]
    });

    if (users.length === 0) {
      log('   No users have linked wallets yet', 'yellow');
      return;
    }

    console.log('\n   ┌─────────────────────────────────────────────────────────────────────────┐');
    users.forEach((user, index) => {
      const num = String(index + 1).padStart(2, ' ');
      const username = user.username.padEnd(20, ' ');
      const playername = (user.playername || '-').padEnd(20, ' ');
      console.log(`   │ ${num}. ${username} ${user.walletAddress} │`);
    });
    console.log('   └─────────────────────────────────────────────────────────────────────────┘\n');

    log(`   Total: ${users.length} user(s) with linked wallets`, 'green');

  } catch (error) {
    log(`❌ Error listing wallets: ${error.message}`, 'red');
  }
}

// Verify wallet linkage for a user
async function verifyWallet(username) {
  try {
    log(`\n🔍 Verifying wallet for user "${username}"...`, 'cyan');

    const user = await db.User.findOne({ 
      where: { username },
      attributes: ['username', 'playername', 'email', 'walletAddress', 'createdAt']
    });

    if (!user) {
      log(`❌ User "${username}" not found`, 'red');
      return false;
    }

    console.log('\n   User Information:');
    console.log(`   ├─ Username:    ${user.username}`);
    console.log(`   ├─ Player Name: ${user.playername || 'Not set'}`);
    console.log(`   ├─ Email:       ${user.email}`);
    console.log(`   ├─ Created:     ${user.createdAt}`);
    
    if (user.walletAddress) {
      log(`   └─ Wallet:      ${user.walletAddress}`, 'green');
      log('\n✅ Wallet is linked!', 'green');
    } else {
      log('   └─ Wallet:      Not linked', 'yellow');
      log('\n⚠️  No wallet linked to this user', 'yellow');
    }

    return !!user.walletAddress;

  } catch (error) {
    log(`❌ Error verifying wallet: ${error.message}`, 'red');
    return false;
  }
}

// Bulk link wallets from JSON file
async function bulkLink(jsonFile) {
  try {
    log(`\n📦 Bulk linking wallets from ${jsonFile}...`, 'cyan');

    const data = require(jsonFile);
    if (!Array.isArray(data)) {
      log('❌ JSON file must contain an array of {username, walletAddress} objects', 'red');
      return;
    }

    let success = 0;
    let failed = 0;

    for (const item of data) {
      const { username, walletAddress } = item;
      if (!username || !walletAddress) {
        log(`⚠️  Skipping invalid entry: ${JSON.stringify(item)}`, 'yellow');
        failed++;
        continue;
      }

      const result = await linkWallet(username, walletAddress);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    log(`\n📊 Bulk link completed:`, 'cyan');
    log(`   ✅ Success: ${success}`, 'green');
    log(`   ❌ Failed:  ${failed}`, 'red');

  } catch (error) {
    log(`❌ Error in bulk link: ${error.message}`, 'red');
  }
}

// Show usage
function showUsage() {
  console.log(`
${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}
${colors.green}           Wallet Management Tool - Using Sequelize${colors.reset}
${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}

${colors.yellow}COMMANDS:${colors.reset}

  ${colors.green}link${colors.reset} <username> <walletAddress>
      Link a wallet address to a user account
      Example: node manage-wallets.cjs link alice 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

  ${colors.green}unlink${colors.reset} <username>
      Remove wallet address from a user account
      Example: node manage-wallets.cjs unlink alice

  ${colors.green}list${colors.reset}
      Show all users with linked wallets
      Example: node manage-wallets.cjs list

  ${colors.green}verify${colors.reset} <username>
      Check if a user has a wallet linked
      Example: node manage-wallets.cjs verify alice

  ${colors.green}bulk${colors.reset} <jsonFile>
      Link multiple wallets from a JSON file
      Example: node manage-wallets.cjs bulk wallets.json

${colors.yellow}HARDHAT TEST ACCOUNTS:${colors.reset}

  Account #0: ${colors.cyan}0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266${colors.reset}
  Account #1: ${colors.cyan}0x70997970C51812dc3A010C7d01b50e0d17dc79C8${colors.reset}
  Account #2: ${colors.cyan}0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC${colors.reset}

${colors.yellow}BULK JSON FORMAT:${colors.reset}

  [
    {"username": "alice", "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"},
    {"username": "bob", "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"}
  ]

${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}
`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showUsage();
    process.exit(0);
  }

  const command = args[0].toLowerCase();

  try {
    switch (command) {
      case 'link':
        if (args.length !== 3) {
          log('❌ Usage: node manage-wallets.cjs link <username> <walletAddress>', 'red');
          process.exit(1);
        }
        await linkWallet(args[1], args[2]);
        break;

      case 'unlink':
        if (args.length !== 2) {
          log('❌ Usage: node manage-wallets.cjs unlink <username>', 'red');
          process.exit(1);
        }
        await unlinkWallet(args[1]);
        break;

      case 'list':
        await listWallets();
        break;

      case 'verify':
        if (args.length !== 2) {
          log('❌ Usage: node manage-wallets.cjs verify <username>', 'red');
          process.exit(1);
        }
        await verifyWallet(args[1]);
        break;

      case 'bulk':
        if (args.length !== 2) {
          log('❌ Usage: node manage-wallets.cjs bulk <jsonFile>', 'red');
          process.exit(1);
        }
        await bulkLink(args[1]);
        break;

      default:
        log(`❌ Unknown command: ${command}`, 'red');
        showUsage();
        process.exit(1);
    }

    process.exit(0);

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run main function
main();
