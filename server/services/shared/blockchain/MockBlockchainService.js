// Mock blockchain service for testing without actual blockchain
// Simulates all blockchain operations with instant responses
const crypto = require('crypto');

class MockBlockchainService {
  constructor() {
    this.mockTransactions = new Map();
    this.mockTokenIds = new Map();
    this.nextTokenId = 1;
    this.enabled = true;
    
    console.log('🎭 Mock Blockchain Service initialized (Simulation Mode)');
    console.log('💡 All transactions are simulated - no actual blockchain required');
  }

  async initialize() {
    this.enabled = true;
    console.log('✅ Mock blockchain ready');
    return true;
  }

  isEnabled() {
    return this.enabled;
  }

  hashToBytes32(itemHash) {
    if (!itemHash || itemHash.length !== 64) {
      throw new Error('Invalid item hash: must be 64 hex characters');
    }
    return '0x' + itemHash;
  }

  generateMockTxHash() {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }

  async mintItem(ownerAddress, itemHash, itemName, tier, tokenURI = '') {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const itemHashBytes = this.hashToBytes32(itemHash);

    // Check if already minted
    if (this.mockTokenIds.has(itemHash)) {
      console.log(`ℹ️  [MOCK] Item ${itemHash} already minted`);
      return {
        tokenId: this.mockTokenIds.get(itemHash).toString(),
        transactionHash: null,
        alreadyMinted: true
      };
    }

    const tokenId = this.nextTokenId++;
    const txHash = this.generateMockTxHash();
    const blockNumber = Math.floor(Date.now() / 1000);

    this.mockTokenIds.set(itemHash, tokenId);
    this.mockTransactions.set(txHash, {
      type: 'MINT',
      itemHash,
      tokenId,
      owner: ownerAddress,
      timestamp: new Date()
    });

    console.log(`✅ [MOCK] Item minted: ${itemName} (${tier})`);
    console.log(`   TokenId: ${tokenId}, Tx: ${txHash.substring(0, 10)}...`);

    return {
      tokenId: tokenId.toString(),
      transactionHash: txHash,
      blockNumber,
      gasUsed: '89234',
      alreadyMinted: false
    };
  }

  async executeTrade(sellerItemHash, buyerItemHash, sellerAddress, buyerAddress) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150));

    const sellerHashBytes = this.hashToBytes32(sellerItemHash);
    const buyerHashBytes = this.hashToBytes32(buyerItemHash);

    // Verify both items are minted
    if (!this.mockTokenIds.has(sellerItemHash) || !this.mockTokenIds.has(buyerItemHash)) {
      throw new Error('[MOCK] One or both items not minted as NFTs');
    }

    const txHash = this.generateMockTxHash();
    const blockNumber = Math.floor(Date.now() / 1000);

    this.mockTransactions.set(txHash, {
      type: 'TRADE',
      sellerItemHash,
      buyerItemHash,
      seller: sellerAddress,
      buyer: buyerAddress,
      timestamp: new Date()
    });

    console.log(`✅ [MOCK] Trade executed successfully`);
    console.log(`   Seller: ${sellerAddress.substring(0, 8)}... → Buyer: ${buyerAddress.substring(0, 8)}...`);
    console.log(`   Tx: ${txHash.substring(0, 10)}...`);

    return {
      transactionHash: txHash,
      blockNumber,
      gasUsed: '142567'
    };
  }

  async recordListing(itemHash, sellerAddress, listingId) {
    await new Promise(resolve => setTimeout(resolve, 50));

    const txHash = this.generateMockTxHash();
    const blockNumber = Math.floor(Date.now() / 1000);

    this.mockTransactions.set(txHash, {
      type: 'LIST',
      itemHash,
      seller: sellerAddress,
      listingId,
      timestamp: new Date()
    });

    console.log(`✅ [MOCK] Listing recorded: ListingId ${listingId}, Tx: ${txHash.substring(0, 10)}...`);

    return {
      transactionHash: txHash,
      blockNumber
    };
  }

  async recordUnlisting(itemHash, sellerAddress) {
    await new Promise(resolve => setTimeout(resolve, 50));

    const txHash = this.generateMockTxHash();
    const blockNumber = Math.floor(Date.now() / 1000);

    this.mockTransactions.set(txHash, {
      type: 'UNLIST',
      itemHash,
      seller: sellerAddress,
      timestamp: new Date()
    });

    console.log(`✅ [MOCK] Unlisting recorded: Tx: ${txHash.substring(0, 10)}...`);

    return {
      transactionHash: txHash,
      blockNumber
    };
  }

  async getBalance(address = null) {
    return '10000.0'; // Mock balance
  }

  async getGasPrice() {
    return '20.5'; // Mock gas price in gwei
  }

  // Additional mock methods
  getTransaction(txHash) {
    return this.mockTransactions.get(txHash) || null;
  }

  getAllTransactions() {
    return Array.from(this.mockTransactions.entries()).map(([hash, data]) => ({
      hash,
      ...data
    }));
  }

  getTokenId(itemHash) {
    return this.mockTokenIds.get(itemHash) || null;
  }

  reset() {
    this.mockTransactions.clear();
    this.mockTokenIds.clear();
    this.nextTokenId = 1;
    console.log('🔄 Mock blockchain state reset');
  }
}

// Singleton instance
const mockBlockchainService = new MockBlockchainService();

module.exports = mockBlockchainService;
