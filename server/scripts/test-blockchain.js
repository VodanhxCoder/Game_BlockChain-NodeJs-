import db from '../services/shared/models/index.js';
import blockchainService from '../services/shared/blockchain/HardhatBlockchainService.js';


async function testBlockchainIntegration() {
  console.log('🧪 Testing Blockchain Integration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Connect to database
    console.log('1️⃣  Connecting to database...');
    await db.sequelize.authenticate();
    console.log('   [OK] Database connected\n');

    // 2. Initialize blockchain
    console.log('2️⃣  Initializing blockchain service...');
    await blockchainService.initialize();
    
    if (!blockchainService.isEnabled()) {
      console.log('\n[ERROR] Blockchain not enabled. Make sure:');
      console.log('   • Hardhat node is running: npx hardhat node');
      console.log('   • Contract is deployed: npx hardhat run scripts/deploy-contract.js --network localhost');
      console.log('   • CONTRACT_ADDRESS is in .env file');
      process.exit(1);
    }
    console.log('   [OK] Blockchain service enabled\n');

    // 3. Get test accounts
    console.log('3️⃣  Getting test accounts from database...');
    const users = await db.User.findAll({ limit: 2 });
    
    if (users.length < 2) {
      console.log('   [ERROR] Need at least 2 users in database');
      process.exit(1);
    }

    const seller = users[0];
    const buyer = users[1];
    
    console.log('   Seller:', seller.username, '- Wallet:', seller.walletAddress || 'NOT SET');
    console.log('   Buyer:', buyer.username, '- Wallet:', buyer.walletAddress || 'NOT SET');

    if (!seller.walletAddress || !buyer.walletAddress) {
      console.log('\n   [WARN]  Users need wallet addresses!');
      console.log('   Update manually:');
      console.log(`   UPDATE users SET walletAddress='0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' WHERE username='${seller.username}';`);
      console.log(`   UPDATE users SET walletAddress='0x70997970C51812dc3A010C7d01b50e0d17dc79C8' WHERE username='${buyer.username}';`);
      process.exit(1);
    }
    console.log('   [OK] Users have wallet addresses\n');

    // 4. Get test items
    console.log('4️⃣  Getting inventory items...');
    const sellerItem = await db.InventoryItem.findOne({
      where: { 
        owner: seller.username,
        inMarket: 0
      }
    });

    if (!sellerItem) {
      console.log('   [ERROR] Seller has no items to trade');
      process.exit(1);
    }

    console.log('   Item Hash:', sellerItem.itemHash);
    console.log('   [OK] Found item to trade\n');

    // 5. Check if item is minted
    console.log('5️⃣  Checking if item is minted as NFT...');
    const isMinted = await blockchainService.isItemMinted(sellerItem.itemHash);
    console.log('   Minted:', isMinted);

    if (!isMinted) {
      console.log('   ℹ️  Item not minted yet. Minting now...');
      const itemDetails = await db.Item.findOne({ where: { itemId: sellerItem.itemId } });
      
      await blockchainService.mintItem(
        sellerItem.itemHash,
        seller.walletAddress,
        itemDetails.itemName,
        itemDetails.tier,
        seller.username
      );
      console.log('   [OK] Item minted successfully\n');
    } else {
      console.log('   [OK] Item already minted\n');
    }

    // 6. Create a test listing
    console.log('6️⃣  Creating market listing...');
    const listing = await db.MarketListing.create({
      itemHash: sellerItem.itemHash,
      itemId: sellerItem.itemId,
      seller: seller.username,
      price: 100
    });

    // Record listing on blockchain
    await blockchainService.recordListing(
      sellerItem.itemHash,
      seller.walletAddress,
      listing.listingId,
      seller.username
    );
    console.log('   [OK] Listing created (ID:', listing.listingId + ')\n');

    // 7. Execute a test trade
    console.log('7️⃣  Executing blockchain trade...');
    
    const result = await blockchainService.executeTrade(
      sellerItem.itemHash,
      null, // No buyer item (simple purchase)
      seller.walletAddress,
      buyer.walletAddress,
      listing.listingId,
      seller.username,
      buyer.username
    );

    console.log('\n   [OK] Trade executed successfully!');
    console.log('   Transaction Hash:', result.transactionHash);
    console.log('   Block Number:', result.blockNumber);
    console.log('   Gas Used:', result.gasUsed);
    console.log('   Trade Log ID:', result.tradeLogId);

    // 8. Verify in database
    console.log('\n8️⃣  Verifying trade in database...');
    const tradeLog = await db.TradeLog.findByPk(result.tradeLogId);
    
    console.log('   Trade Log:');
    console.log('   - ID:', tradeLog.tradeId);
    console.log('   - Item:', tradeLog.itemHash.substring(0, 10) + '...');
    console.log('   - From:', tradeLog.fromUser, '(' + tradeLog.fromWallet.substring(0, 10) + '...)');
    console.log('   - To:', tradeLog.toUser, '(' + tradeLog.toWallet.substring(0, 10) + '...)');
    console.log('   - TX Hash:', tradeLog.transactionHash);
    console.log('   - Status:', tradeLog.status);
    console.log('   - Block:', tradeLog.blockNumber);
    console.log('   [OK] Trade logged successfully\n');

    // 9. Clean up test data
    console.log('9️⃣  Cleaning up test data...');
    await listing.destroy();
    console.log('   [OK] Test listing removed\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[OK] All tests passed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n[ERROR] Test failed:', error.message);
    console.error(error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

testBlockchainIntegration();
