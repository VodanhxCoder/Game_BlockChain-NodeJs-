/**
 * Quick script to manually link wallet addresses to user accounts
 * Usage: node link-wallet.cjs username walletAddress
 * Example: node link-wallet.cjs alice 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 */

const db = require('./src/models');

async function linkWallet(username, walletAddress) {
  try {
    console.log(`🔗 Linking wallet ${walletAddress} to user ${username}...`);

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      console.error('❌ Invalid wallet address format. Must be 0x followed by 40 hex characters.');
      process.exit(1);
    }

    // Find user
    const user = await db.User.findOne({ where: { username } });
    if (!user) {
      console.error(`❌ User ${username} not found in database.`);
      process.exit(1);
    }

    // Check if wallet is already linked to another user
    const existing = await db.User.findOne({ where: { walletAddress } });
    if (existing && existing.username !== username) {
      console.error(`❌ Wallet ${walletAddress} is already linked to user ${existing.username}.`);
      process.exit(1);
    }

    // Update user's wallet address
    await db.User.update(
      { walletAddress },
      { where: { username } }
    );

    console.log(`✅ Successfully linked wallet to ${username}!`);
    console.log(`   Username: ${username}`);
    console.log(`   Wallet: ${walletAddress}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error linking wallet:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node link-wallet.cjs <username> <walletAddress>');
  console.log('');
  console.log('Examples:');
  console.log('  node link-wallet.cjs alice 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  console.log('  node link-wallet.cjs bob 0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  console.log('');
  console.log('Default Hardhat test accounts:');
  console.log('  Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  console.log('  Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  console.log('  Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  process.exit(1);
}

const [username, walletAddress] = args;
linkWallet(username, walletAddress);
