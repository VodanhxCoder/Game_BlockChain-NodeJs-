const { ethers } = require('ethers');
const db = require('../models');

class HardhatBlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.contractAddress = process.env.CONTRACT_ADDRESS || process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
    this.enabled = false;
  }

  async initialize() {
    try {
      if (!this.contractAddress) {
        console.log('⚠️  CONTRACT_ADDRESS not set in .env - blockchain features disabled');
        console.log('   To enable: Deploy contract and add CONTRACT_ADDRESS=0x... to .env');
        return;
      }

      // Connect to Hardhat local node
      this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      
      // Test connection
      await this.provider.getNetwork();
      
      // Use the first account as the server's wallet
      this.signer = await this.provider.getSigner(0);
      
      // Load contract ABI
      const contractJson = require('../../artifacts/contracts/ItemTradingNFT.sol/ItemTradingNFT.json');
      
      // Create contract instance
      this.contract = new ethers.Contract(
        this.contractAddress,
        contractJson.abi,
        this.signer
      );

      // Verify contract is deployed
      const code = await this.provider.getCode(this.contractAddress);
      if (code === '0x') {
        throw new Error('Contract not deployed at this address');
      }

      this.enabled = true;
      console.log('✅ Hardhat blockchain service initialized');
      console.log('   Network: Hardhat Local (chainId: 31337)');
      console.log('   Contract:', this.contractAddress);
      console.log('   Signer:', await this.signer.getAddress());
      
    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error.message);
      console.log('   Make sure:');
      console.log('   1. Hardhat node is running: npx hardhat node');
      console.log('   2. Contract is deployed: npx hardhat run scripts/deploy-contract.js --network localhost');
      console.log('   3. CONTRACT_ADDRESS is set in .env file');
      this.enabled = false;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * Execute trade on blockchain (database logging handled by controller)
   */
  async executeTrade(sellerItemHash, buyerItemHash, sellerAddress, buyerAddress, listingId, sellerUsername, buyerUsername) {
    if (!this.enabled) {
      console.log('⚠️  Blockchain disabled - skipping on-chain trade');
      return null;
    }

    try {
      console.log('🔗 Executing blockchain trade...');
      console.log('   Seller:', sellerAddress, '→ Item:', sellerItemHash.substring(0, 10) + '...');
      console.log('   Buyer:', buyerAddress, '→ Item:', buyerItemHash ? buyerItemHash.substring(0, 10) + '...' : 'none');
      
      // Convert item hashes to bytes32
      const sellerHashBytes = '0x' + sellerItemHash;
      const buyerHashBytes = buyerItemHash ? '0x' + buyerItemHash : '0x' + '0'.repeat(64);

      // Execute trade on smart contract
      const tx = await this.contract.executeTrade(
        sellerHashBytes,
        buyerHashBytes,
        sellerAddress,
        buyerAddress
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      console.log('   Waiting for confirmation...');
      
      const receipt = await tx.wait();

      console.log('✅ Trade confirmed on blockchain!');
      console.log('   TX Hash:', receipt.hash);
      console.log('   Block:', receipt.blockNumber);
      console.log('   Gas Used:', receipt.gasUsed.toString());

      // Return transaction hash for controller to log
      return receipt.hash;

    } catch (error) {
      console.error('❌ Blockchain trade failed:', error.message);
      throw error;
    }
  }

  /**
   * Mint NFT for a new item
   */
  async mintItem(itemHash, ownerAddress, itemName, tier, ownerUsername) {
    if (!this.enabled) {
      console.log('⚠️  Blockchain disabled - skipping NFT mint');
      return null;
    }

    try {
      console.log('🎨 Minting NFT for item:', itemName);
      console.log('   Owner:', ownerAddress);
      console.log('   Hash:', itemHash);
      
      const itemHashBytes = '0x' + itemHash;
      const tokenURI = `https://game.example.com/api/items/${itemHash}/metadata`;

      // Contract signature: mintItem(address to, bytes32 itemHash, string itemName, string tier, string _tokenURI)
      const tx = await this.contract.mintItem(
        ownerAddress,      // address to
        itemHashBytes,     // bytes32 itemHash
        itemName,          // string itemName
        tier,              // string tier
        tokenURI           // string _tokenURI
      );

      const receipt = await tx.wait();

      console.log('✅ Item minted:', itemName);
      console.log('   TX Hash:', receipt.hash);
      console.log('   Block:', receipt.blockNumber);

      // Database logging removed - handled by TradeController if needed

      return receipt.hash;

    } catch (error) {
      console.error('❌ Mint failed:', error.message);
      throw error;
    }
  }

  /**
   * Record listing on blockchain
   */
  async recordListing(itemHash, sellerAddress, listingId, sellerUsername) {
    if (!this.enabled) {
      console.log('⚠️  Blockchain disabled - skipping listing record');
      return null;
    }

    try {
      console.log('📝 Recording listing on blockchain...');
      
      const itemHashBytes = '0x' + itemHash;

      const tx = await this.contract.listItem(
        itemHashBytes,
        sellerAddress,
        listingId
      );

      const receipt = await tx.wait();

      console.log('✅ Listing recorded:', receipt.hash);

      // Log to database
      await db.TradeLog.create({
        itemHash: itemHash,
        fromUser: sellerUsername,
        fromWallet: sellerAddress,
        transactionHash: receipt.hash,
        transactionType: 'LIST',
        status: 'CONFIRMED',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        listingId: listingId
      });

      return receipt.hash;

    } catch (error) {
      console.error('❌ List recording failed:', error.message);
      
      await db.TradeLog.create({
        itemHash: itemHash,
        fromUser: sellerUsername,
        fromWallet: sellerAddress,
        transactionType: 'LIST',
        status: 'FAILED',
        listingId: listingId,
        errorMessage: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransaction(txHash) {
    if (!this.enabled) return null;
    
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return { transaction: tx, receipt };
    } catch (error) {
      console.error('Error fetching transaction:', error.message);
      return null;
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    if (!this.enabled) return null;
    return await this.provider.getBlockNumber();
  }

  /**
   * Check if item is minted as NFT
   */
  async isItemMinted(itemHash) {
    if (!this.enabled) return false;
    
    try {
      const itemHashBytes = '0x' + itemHash;
      return await this.contract.itemMinted(itemHashBytes);
    } catch (error) {
      return false;
    }
  }
  /**
   * Verify that a wallet address owns the NFT for a given item hash
   */
  async verifyOwnership(itemHash, walletAddress) {
    if (!this.enabled) {
      return true; // Skip verification if blockchain disabled
    }
    
    try {
      const itemHashBytes = '0x' + itemHash;
      
      // Get token ID for this item
      const tokenId = await this.contract.itemHashToTokenId(itemHashBytes);
      
      if (tokenId.toString() === '0') {
        console.log(`   Item ${itemHash} not minted yet`);
        return false;
      }
      
      // Get the owner of this token
      const owner = await this.contract.ownerOf(tokenId);
      
      console.log(`   Item ${itemHash}: Token #${tokenId} owned by ${owner}`);
      console.log(`   Expected owner: ${walletAddress}`);
      
      return owner.toLowerCase() === walletAddress.toLowerCase();
      
    } catch (error) {
      console.error('   Ownership verification error:', error.message);
      return false;
    }
  }

  /**
   * Transfer NFT to the correct owner (used when wallet was linked after minting)
   */
  async transferToCorrectOwner(itemHash, correctOwnerAddress) {
    if (!this.enabled) {
      throw new Error('Blockchain disabled');
    }
    
    try {
      const itemHashBytes = '0x' + itemHash;
      
      // Get token ID for this item
      const tokenId = await this.contract.itemHashToTokenId(itemHashBytes);
      
      if (tokenId.toString() === '0') {
        throw new Error('Item not minted');
      }
      
      // Get current owner
      const currentOwner = await this.contract.ownerOf(tokenId);
      
      console.log(`   Transferring Token #${tokenId} from ${currentOwner} to ${correctOwnerAddress}`);
      
      // Transfer from current owner to correct owner (using contract owner/signer)
      const tx = await this.contract.transferFrom(currentOwner, correctOwnerAddress, tokenId);
      const receipt = await tx.wait();
      
      console.log(`   Transfer successful: ${receipt.hash}`);
      
      return receipt.hash;
      
    } catch (error) {
      console.error('   Transfer error:', error.message);
      throw error;
    }
  }
}

module.exports = new HardhatBlockchainService();
