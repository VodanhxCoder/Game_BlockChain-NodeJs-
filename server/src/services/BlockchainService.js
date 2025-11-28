// Blockchain service for interacting with the ItemTradingNFT smart contract
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Check if we should use mock blockchain
const USE_MOCK = process.env.BLOCKCHAIN_USE_MOCK === 'true' || !process.env.BLOCKCHAIN_RPC_URL;

// Import mock service if needed
if (USE_MOCK) {
  console.log('🎭 Using Mock Blockchain Service (No real blockchain required)');
  module.exports = require('./MockBlockchainService');
} else {
  console.log('⛓️  Using Real Blockchain Service');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
  }

  /**
   * Initialize blockchain connection
   * Reads configuration from environment variables
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
      const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

      if (!rpcUrl || !privateKey || !contractAddress) {
        console.warn('⚠️  Blockchain not configured. Set BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, and BLOCKCHAIN_CONTRACT_ADDRESS in .env');
        return;
      }

      // Connect to blockchain network
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Load contract ABI
      const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'ItemTradingNFT.sol', 'ItemTradingNFT.json');
      
      if (!fs.existsSync(artifactPath)) {
        console.warn('⚠️  Contract artifact not found. Run: npx hardhat compile');
        return;
      }

      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      this.contract = new ethers.Contract(contractAddress, artifact.abi, this.wallet);

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`✅ Blockchain initialized on network: ${network.name} (chainId: ${network.chainId})`);
      console.log(`📝 Contract address: ${contractAddress}`);
      console.log(`💼 Wallet address: ${this.wallet.address}`);

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Check if blockchain is enabled and initialized
   */
  isEnabled() {
    return this.initialized && this.contract !== null;
  }

  /**
   * Convert itemHash string to bytes32 format
   */
  hashToBytes32(itemHash) {
    // Ensure hash is 64 characters (32 bytes in hex)
    if (!itemHash || itemHash.length !== 64) {
      throw new Error('Invalid item hash: must be 64 hex characters');
    }
    return '0x' + itemHash;
  }

  /**
   * Mint an NFT for a game item
   * @param {string} ownerAddress - Wallet address of the owner
   * @param {string} itemHash - 64-char hex hash from DB
   * @param {string} itemName - Human-readable item name
   * @param {string} tier - Item tier (Common, Rare, Legendary)
   * @param {string} tokenURI - Metadata URI (optional)
   */
  async mintItem(ownerAddress, itemHash, itemName, tier, tokenURI = '') {
    if (!this.isEnabled()) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const itemHashBytes = this.hashToBytes32(itemHash);

      // Check if already minted
      const isMinted = await this.contract.isItemMinted(itemHashBytes);
      if (isMinted) {
        console.log(`ℹ️  Item ${itemHash} already minted`);
        const tokenId = await this.contract.getTokenId(itemHashBytes);
        return { tokenId: tokenId.toString(), transactionHash: null, alreadyMinted: true };
      }

      // Estimate gas
      const gasEstimate = await this.contract.mintItem.estimateGas(
        ownerAddress,
        itemHashBytes,
        itemName,
        tier,
        tokenURI
      );

      // Mint the NFT
      const tx = await this.contract.mintItem(
        ownerAddress,
        itemHashBytes,
        itemName,
        tier,
        tokenURI,
        { gasLimit: gasEstimate * 120n / 100n } // Add 20% buffer
      );

      console.log(`🔄 Minting item ${itemName} (${tier})... tx: ${tx.hash}`);
      const receipt = await tx.wait();

      // Extract tokenId from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed && parsed.name === 'ItemMinted';
        } catch { return false; }
      });

      let tokenId = null;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        tokenId = parsed.args.tokenId.toString();
      }

      console.log(`✅ Item minted successfully. TokenId: ${tokenId}, Gas used: ${receipt.gasUsed.toString()}`);

      return {
        tokenId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        alreadyMinted: false
      };
    } catch (error) {
      console.error('❌ Failed to mint item:', error.message);
      throw error;
    }
  }

  /**
   * Execute an atomic trade between two items
   * @param {string} sellerItemHash - Seller's item hash
   * @param {string} buyerItemHash - Buyer's item hash
   * @param {string} sellerAddress - Seller's wallet address
   * @param {string} buyerAddress - Buyer's wallet address
   */
  async executeTrade(sellerItemHash, buyerItemHash, sellerAddress, buyerAddress) {
    if (!this.isEnabled()) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const sellerHashBytes = this.hashToBytes32(sellerItemHash);
      const buyerHashBytes = this.hashToBytes32(buyerItemHash);

      // Verify both items are minted
      const sellerMinted = await this.contract.isItemMinted(sellerHashBytes);
      const buyerMinted = await this.contract.isItemMinted(buyerHashBytes);

      if (!sellerMinted || !buyerMinted) {
        throw new Error('One or both items not minted as NFTs');
      }

      // Estimate gas
      const gasEstimate = await this.contract.executeTrade.estimateGas(
        sellerHashBytes,
        buyerHashBytes,
        sellerAddress,
        buyerAddress
      );

      // Execute trade
      const tx = await this.contract.executeTrade(
        sellerHashBytes,
        buyerHashBytes,
        sellerAddress,
        buyerAddress,
        { gasLimit: gasEstimate * 120n / 100n }
      );

      console.log(`🔄 Executing trade... tx: ${tx.hash}`);
      const receipt = await tx.wait();

      console.log(`✅ Trade executed successfully. Gas used: ${receipt.gasUsed.toString()}`);

      const effectiveGasPrice = receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : (receipt.gasPrice ? receipt.gasPrice.toString() : null);
      let gasFeeWei = null;
      let gasFeeEth = null;
      if (receipt.gasUsed && effectiveGasPrice) {
        try {
          const feeBig = BigInt(receipt.gasUsed.toString()) * BigInt(effectiveGasPrice);
          gasFeeWei = feeBig.toString();
          try { gasFeeEth = ethers.formatEther(feeBig); } catch (e) { gasFeeEth = null; }
        } catch (err) {
          console.warn('Failed to compute gas fee in BlockchainService.executeTrade:', err && err.message ? err.message : err);
        }
      }

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasFeeWei,
        gasFeeEth
      };
    } catch (error) {
      console.error('❌ Failed to execute trade:', error.message);
      throw error;
    }
  }

  /**
   * Record a listing event on-chain (doesn't transfer ownership)
   */
  async recordListing(itemHash, sellerAddress, listingId) {
    if (!this.isEnabled()) {
      console.log('ℹ️  Blockchain disabled, skipping listing record');
      return null;
    }

    try {
      const itemHashBytes = this.hashToBytes32(itemHash);
      
      const tx = await this.contract.recordListing(itemHashBytes, sellerAddress, listingId);
      const receipt = await tx.wait();

      console.log(`✅ Listing recorded on-chain. Tx: ${receipt.hash}`);
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('⚠️  Failed to record listing on-chain:', error.message);
      return null; // Don't fail the whole operation
    }
  }

  /**
   * Record an unlisting event on-chain
   */
  async recordUnlisting(itemHash, sellerAddress) {
    if (!this.isEnabled()) {
      console.log('ℹ️  Blockchain disabled, skipping unlisting record');
      return null;
    }

    try {
      const itemHashBytes = this.hashToBytes32(itemHash);
      
      const tx = await this.contract.recordUnlisting(itemHashBytes, sellerAddress);
      const receipt = await tx.wait();

      console.log(`✅ Unlisting recorded on-chain. Tx: ${receipt.hash}`);
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('⚠️  Failed to record unlisting on-chain:', error.message);
      return null;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address = null) {
    if (!this.isEnabled()) return '0';
    
    try {
      const addr = address || this.wallet.address;
      const balance = await this.provider.getBalance(addr);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error.message);
      return '0';
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    if (!this.isEnabled()) return '0';
    
    try {
      const feeData = await this.provider.getFeeData();
      return ethers.formatUnits(feeData.gasPrice, 'gwei');
    } catch (error) {
      console.error('Failed to get gas price:', error.message);
      return '0';
    }
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;

} // End of USE_MOCK check
