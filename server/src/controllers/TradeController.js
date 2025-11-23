import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { ethers } = require('ethers');
import db from '../models/index.js';
const { sequelize, InventoryItem, MarketListing, User, TradeLog } = db;

// HardhatBlockchainService is exported as CommonJS
const HardhatBlockchainService = require('../services/HardhatBlockchainService');

// Prepare calldata for MetaMask transaction (does not modify DB)
const prepareTrade = async (req, res) => {
  try {
    const { listingId, buyer, buyerInventoryItemId, buyerWallet } = req.body;
    if (!listingId || !buyer || !buyerInventoryItemId || !buyerWallet) {
      return res.status(400).json({ error: 'listingId, buyer, buyerInventoryItemId and buyerWallet are required' });
    }

    const listing = await MarketListing.findOne({ where: { listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller === buyer) return res.status(400).json({ error: 'Seller cannot buy their own listing' });

    const sellerItem = await InventoryItem.findOne({ where: { itemHash: listing.itemHash } });
    if (!sellerItem) return res.status(404).json({ error: 'Seller inventory item not found' });
    if (sellerItem.owner !== listing.seller) return res.status(400).json({ error: 'Listing owner mismatch' });
    if (!sellerItem.inMarket) return res.status(400).json({ error: 'Item is no longer listed' });

    const buyerItem = await InventoryItem.findOne({ where: { inventoryItemId: buyerInventoryItemId } });
    if (!buyerItem) return res.status(404).json({ error: 'Buyer inventory item not found' });
    if (buyerItem.owner !== buyer) return res.status(403).json({ error: 'You do not own the selected item' });
    if (buyerItem.inMarket) return res.status(400).json({ error: 'Selected item is currently listed and cannot be used for trade' });

    // Get seller's wallet address from User table
    const sellerUser = await User.findOne({ where: { username: listing.seller } });
    if (!sellerUser || !sellerUser.walletAddress) {
      return res.status(400).json({ error: 'Seller wallet address not found. Please contact seller to link their wallet.' });
    }

    // Get buyer's user info for wallet
    const buyerUser = await User.findOne({ where: { username: buyer } });
    if (!buyerUser || !buyerUser.walletAddress) {
      return res.status(400).json({ error: 'Buyer wallet address not found. Please link your wallet first.' });
    }

    // Auto-mint seller's item if not minted yet
    console.log('🔍 Checking if seller item is minted...');
    const sellerMinted = await HardhatBlockchainService.isItemMinted(listing.itemHash);
    if (!sellerMinted) {
      console.log('🎨 Seller item not minted. Minting now...');
      try {
        await HardhatBlockchainService.mintItem(
          listing.itemHash,
          sellerUser.walletAddress,
          sellerItem.itemName || 'Game Item',
          sellerItem.tier || 'Common',
          listing.seller
        );
        console.log('✅ Seller item minted successfully');
      } catch (mintError) {
        console.error('❌ Failed to mint seller item:', mintError.message);
        return res.status(500).json({ 
          error: 'Failed to mint seller item as NFT',
          details: mintError.message 
        });
      }
    } else {
      console.log('✅ Seller item already minted');
    }

    // Auto-mint buyer's item if not minted yet
    console.log('🔍 Checking if buyer item is minted...');
    const buyerMinted = await HardhatBlockchainService.isItemMinted(buyerItem.itemHash);
    if (!buyerMinted) {
      console.log('🎨 Buyer item not minted. Minting now...');
      try {
        await HardhatBlockchainService.mintItem(
          buyerItem.itemHash,
          buyerUser.walletAddress,
          buyerItem.itemName || 'Game Item',
          buyerItem.tier || 'Common',
          buyer
        );
        console.log('✅ Buyer item minted successfully');
      } catch (mintError) {
        console.error('❌ Failed to mint buyer item:', mintError.message);
        return res.status(500).json({ 
          error: 'Failed to mint buyer item as NFT',
          details: mintError.message 
        });
      }
    } else {
      console.log('✅ Buyer item already minted');
    }

    // Verify NFT ownership before preparing trade
    console.log('🔍 Verifying NFT ownership...');
    try {
      const sellerOwnership = await HardhatBlockchainService.verifyOwnership(listing.itemHash, sellerUser.walletAddress);
      const buyerOwnership = await HardhatBlockchainService.verifyOwnership(buyerItem.itemHash, buyerUser.walletAddress);
      
      console.log('   Seller owns NFT:', sellerOwnership);
      console.log('   Buyer owns NFT:', buyerOwnership);
      
      // If ownership doesn't match, try to transfer the NFT to the correct owner
      if (!sellerOwnership) {
        console.log('⚠️  Seller NFT ownership mismatch - attempting to transfer to correct wallet...');
        try {
          await HardhatBlockchainService.transferToCorrectOwner(listing.itemHash, sellerUser.walletAddress);
          console.log('✅ Seller NFT transferred to correct wallet');
        } catch (transferError) {
          console.error('❌ Failed to transfer seller NFT:', transferError.message);
          return res.status(400).json({ 
            error: 'Seller does not own the NFT for this item',
            details: 'The item was minted to a different wallet. Please contact support.'
          });
        }
      }
      
      if (!buyerOwnership) {
        console.log('⚠️  Buyer NFT ownership mismatch - attempting to transfer to correct wallet...');
        try {
          await HardhatBlockchainService.transferToCorrectOwner(buyerItem.itemHash, buyerUser.walletAddress);
          console.log('✅ Buyer NFT transferred to correct wallet');
        } catch (transferError) {
          console.error('❌ Failed to transfer buyer NFT:', transferError.message);
          return res.status(400).json({ 
            error: 'Buyer does not own the NFT for the selected item',
            details: 'The item was minted to a different wallet. Please contact support.'
          });
        }
      }
      
      console.log('✅ NFT ownership verified');
    } catch (verifyError) {
      console.error('❌ Ownership verification failed:', verifyError.message);
      return res.status(500).json({ 
        error: 'Failed to verify NFT ownership',
        details: verifyError.message 
      });
    }

    // Build calldata for the executeTrade(sellerHash, buyerHash, sellerAddr, buyerAddr)
    let contractJson;
    try {
      const contractPath = path.resolve(__dirname, '../../artifacts/contracts/ItemTradingNFT.sol/ItemTradingNFT.json');
      contractJson = require(contractPath);
    } catch (contractError) {
      console.error('❌ Failed to load contract artifact:', contractError.message);
      console.error('   Looking for: artifacts/contracts/ItemTradingNFT.sol/ItemTradingNFT.json');
      return res.status(500).json({ 
        error: 'Smart contract not deployed. Please deploy the contract first.',
        details: 'Run: npx hardhat run scripts/deploy-contract.js --network localhost'
      });
    }

    const iface = new ethers.Interface(contractJson.abi);

    // prepare bytes32 hashes (contract expects 0x + 64 hex)
    const sellerHashBytes = '0x' + listing.itemHash;
    const buyerHashBytes = buyerItem ? '0x' + buyerItem.itemHash : '0x' + '0'.repeat(64);

    // Use wallet addresses from database (already verified and linked)
    const data = iface.encodeFunctionData('executeTrade', [
      sellerHashBytes, 
      buyerHashBytes, 
      sellerUser.walletAddress,  // Seller's linked wallet
      buyerUser.walletAddress    // Buyer's linked wallet
    ]);

    const contractAddress = HardhatBlockchainService.contractAddress || 
                           process.env.CONTRACT_ADDRESS || 
                           process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

    if (!contractAddress) {
      console.error('❌ Contract address not configured');
      return res.status(500).json({ 
        error: 'Contract address not configured. Please set CONTRACT_ADDRESS in .env file.'
      });
    }

    console.log('✅ Trade prepared:', {
      listingId,
      seller: listing.seller,
      buyer,
      sellerWallet: sellerUser.walletAddress,
      buyerWallet: buyerUser.walletAddress,
      contractAddress
    });

    // For buyer-initiated on-chain trades, we need the seller's signature in contract format
    // The seller should have signed: keccak256(sellerItemHash, listingId, timestamp, contractAddress)
    // But the seller signed a simple message at listing time. We'll need to convert it or have seller re-sign.
    // For now, if seller signature exists, we'll use it as-is and let the frontend handle it.
    
    return res.json({
      contractAddress,
      data,
      value: '0x0',
      listingId,
      seller: listing.seller,
      sellerWallet: sellerUser.walletAddress,
      buyerWallet: buyerUser.walletAddress,
      sellerItemHash: listing.itemHash,
      buyerItemHash: buyerItem ? buyerItem.itemHash : null,
      sellerSignature: listing.sellerSignature || null,
      sellerSignatureTimestamp: listing.sellerSignatureTimestamp || null
    });
  } catch (err) {
    console.error('❌ Error preparing trade calldata:', err.message);
    console.error('   Stack:', err.stack);
    return res.status(500).json({ 
      error: 'Failed to prepare trade',
      details: err.message 
    });
  }
};

// Confirm trade after MetaMask transaction is mined
const confirmTrade = async (req, res) => {
  try {
    const { txHash, listingId, buyer, buyerInventoryItemId } = req.body;
    if (!txHash || !listingId || !buyer || !buyerInventoryItemId) {
      return res.status(400).json({ error: 'txHash, listingId, buyer and buyerInventoryItemId are required' });
    }

    // fetch transaction and receipt via blockchain service
    const txInfo = await HardhatBlockchainService.getTransaction(txHash);
    if (!txInfo || !txInfo.receipt) {
      return res.status(404).json({ error: 'Transaction not found yet' });
    }

    const receipt = txInfo.receipt;
    const { ethers } = require('ethers');
    // Note: with ethers v6 receipt.status is 1 for success
    if (receipt.status !== 1 && receipt.status !== '0x1') {
      // log failed
      await TradeLog.create({
        itemHash: listingId,
        fromUser: null,
        toUser: buyer,
        transactionHash: txHash,
        transactionType: 'TRADE',
        status: 'FAILED',
        errorMessage: 'On-chain tx failed',
        metadata: JSON.stringify({ receipt })
      });
      return res.status(400).json({ error: 'On-chain transaction failed' });
    }

    // Now perform the DB atomic swap (same as buyListing) inside a transaction
    const t = await sequelize.transaction();
    try {
      const listing = await MarketListing.findOne({ where: { listingId }, transaction: t });
      if (!listing) {
        await t.rollback();
        return res.status(404).json({ error: 'Listing not found' });
      }

      const sellerItem = await InventoryItem.findOne({ where: { itemHash: listing.itemHash }, transaction: t });
      if (!sellerItem) {
        await t.rollback();
        return res.status(404).json({ error: 'Seller inventory item not found' });
      }
      if (sellerItem.owner !== listing.seller) {
        await t.rollback();
        return res.status(400).json({ error: 'Listing owner mismatch' });
      }
      if (!sellerItem.inMarket) {
        await t.rollback();
        return res.status(400).json({ error: 'Item is no longer listed' });
      }

      const buyerItem = await InventoryItem.findOne({ where: { inventoryItemId: buyerInventoryItemId }, transaction: t });
      if (!buyerItem) {
        await t.rollback();
        return res.status(404).json({ error: 'Buyer inventory item not found' });
      }
      if (buyerItem.owner !== buyer) {
        await t.rollback();
        return res.status(403).json({ error: 'You do not own the selected item' });
      }
      if (buyerItem.inMarket) {
        await t.rollback();
        return res.status(400).json({ error: 'Selected item is currently listed and cannot be used for trade' });
      }

      // Perform swap
      const sellerOwner = sellerItem.owner;
      const sellerInventoryId = sellerItem.inventoryId;
      const currentTime = new Date();

      sellerItem.owner = buyerItem.owner;
      buyerItem.owner = sellerOwner;

      sellerItem.inventoryId = buyerItem.inventoryId;
      buyerItem.inventoryId = sellerInventoryId;

      sellerItem.inMarket = 0;
      buyerItem.inMarket = 0;

      // Update acquired time for both items
      sellerItem.obtainedAt = currentTime;
      buyerItem.obtainedAt = currentTime;

      await sellerItem.save({ transaction: t });
      await buyerItem.save({ transaction: t });

      // Create trade log BEFORE deleting listing (to satisfy foreign key constraint)
      // compute gas fee (wei and ETH) if available
      const gasUsedStr = receipt.gasUsed ? receipt.gasUsed.toString() : null;
      const effectiveGasPriceStr = receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : (receipt.gasPrice ? receipt.gasPrice.toString() : null);
      let gasFeeWei = null;
      let gasFeeEth = null;
      if (gasUsedStr && effectiveGasPriceStr) {
        try {
          const feeBig = BigInt(gasUsedStr) * BigInt(effectiveGasPriceStr);
          gasFeeWei = feeBig.toString();
          gasFeeEth = ethers.formatEther(feeBig);
        } catch (feeErr) {
          console.warn('Failed to compute gas fee in confirmTrade:', feeErr && feeErr.message ? feeErr.message : feeErr);
        }
      }

      const tradeLog = await TradeLog.create({
        itemHash: sellerItem.itemHash,
        tradeItemHash: buyerItem.itemHash,
        fromUser: listing.seller,
        toUser: buyer,
        transactionHash: txHash,
        transactionType: 'TRADE',
        status: 'CONFIRMED',
        blockNumber: receipt.blockNumber,
        gasUsed: gasUsedStr,
        gasFee: gasFeeWei,
        gasFeeEth: gasFeeEth,
        fromWallet: receipt.from || null,
        toWallet: receipt.to || null,
        listingId: listingId,
        metadata: JSON.stringify({ receipt })
      }, { transaction: t });

      // Now delete the listing
      await MarketListing.destroy({ where: { listingId }, transaction: t });

      await t.commit();

      return res.json({ success: true, txHash, tradeLogId: tradeLog.tradeId });
    } catch (err) {
      await t.rollback();
      console.error('Error finalizing trade after tx confirmation', err);
      return res.status(500).json({ error: 'Failed to finalize trade' });
    }

  } catch (err) {
    console.error('Error confirming trade', err);
    return res.status(500).json({ error: 'Failed to confirm trade' });
  }
};

// Execute complete trade - mints, verifies, executes on-chain, and updates DB
const executeTrade = async (req, res) => {
  try {
    const { listingId, buyer, buyerInventoryItemId, buyerWallet, signature, message } = req.body;
    
    if (!listingId || !buyer || !buyerInventoryItemId || !buyerWallet || !signature || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: listingId, buyer, buyerInventoryItemId, buyerWallet, signature, message' 
      });
    }

    console.log('🎯 Executing trade:', { listingId, buyer });

    // Verify signature
    const { ethers } = require('ethers');
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== buyerWallet.toLowerCase()) {
      return res.status(403).json({ error: 'Invalid signature' });
    }
    console.log('✅ Signature verified');

    // Get listing and items
    const listing = await MarketListing.findOne({ where: { listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller === buyer) return res.status(400).json({ error: 'Cannot trade with yourself' });

    const sellerItem = await InventoryItem.findOne({ where: { itemHash: listing.itemHash } });
    if (!sellerItem) return res.status(404).json({ error: 'Seller item not found' });

    const buyerItem = await InventoryItem.findOne({ where: { inventoryItemId: buyerInventoryItemId } });
    if (!buyerItem) return res.status(404).json({ error: 'Buyer item not found' });
    if (buyerItem.owner !== buyer) return res.status(403).json({ error: 'You do not own the selected item' });

    // Get wallet addresses
    const sellerUser = await User.findOne({ where: { username: listing.seller } });
    const buyerUser = await User.findOne({ where: { username: buyer } });
    
    if (!sellerUser?.walletAddress || !buyerUser?.walletAddress) {
      return res.status(400).json({ error: 'Wallet addresses not found' });
    }

    // Auto-mint if needed
    const sellerMinted = await HardhatBlockchainService.isItemMinted(listing.itemHash);
    if (!sellerMinted) {
      await HardhatBlockchainService.mintItem(
        listing.itemHash, sellerUser.walletAddress, 
        sellerItem.itemName || 'Game Item', sellerItem.tier || 'Common', listing.seller
      );
    }

    const buyerMinted = await HardhatBlockchainService.isItemMinted(buyerItem.itemHash);
    if (!buyerMinted) {
      await HardhatBlockchainService.mintItem(
        buyerItem.itemHash, buyerUser.walletAddress,
        buyerItem.itemName || 'Game Item', buyerItem.tier || 'Common', buyer
      );
    }

    // Verify and fix ownership
    const sellerOwns = await HardhatBlockchainService.verifyOwnership(listing.itemHash, sellerUser.walletAddress);
    if (!sellerOwns) {
      console.error(`❌ Seller ownership mismatch:`);
      console.error(`   Seller username: ${listing.seller}`);
      console.error(`   Expected wallet (in DB): ${sellerUser.walletAddress}`);
      console.error(`   Item hash: ${listing.itemHash}`);
      
      return res.status(400).json({ 
        error: 'Seller NFT ownership mismatch',
        details: `The seller's item (${listing.itemName}) was minted to a different wallet. The seller needs to:\n1. Connect the correct wallet in MetaMask\n2. Re-link their wallet using the "Link Wallet" button\n3. Try trading again.\n\nExpected wallet: ${sellerUser.walletAddress}`
      });
    }

    const buyerOwns = await HardhatBlockchainService.verifyOwnership(buyerItem.itemHash, buyerUser.walletAddress);
    if (!buyerOwns) {
      console.error(`❌ Buyer ownership mismatch:`);
      console.error(`   Buyer username: ${buyer}`);
      console.error(`   Expected wallet (in DB): ${buyerUser.walletAddress}`);
      console.error(`   Item hash: ${buyerItem.itemHash}`);
      
      return res.status(400).json({ 
        error: 'Buyer NFT ownership mismatch',
        details: `Your item (${buyerItem.itemName}) was minted to a different wallet. You need to:\n1. Connect the correct wallet in MetaMask\n2. Re-link your wallet using the "Link Wallet" button\n3. Try trading again.\n\nExpected wallet: ${buyerUser.walletAddress}`
      });
    }

    console.log('✅ Ownership verified');

    // Execute trade on blockchain
    console.log('⛓️  Executing trade on blockchain...');
    const txResult = await HardhatBlockchainService.executeTrade(
      listing.itemHash,
      buyerItem.itemHash,
      sellerUser.walletAddress,
      buyerUser.walletAddress,
      listingId,
      listing.seller,
      buyer
    );

    // txResult may be null when blockchain disabled
    let txHash = null;
    let txBlockNumber = null;
    let txGasUsed = null;
    let txEffectiveGasPrice = null;
    let txGasFee = null;
    let txGasFeeEth = null;

    if (txResult) {
      txHash = txResult.txHash || txResult.hash || null;
      txBlockNumber = txResult.blockNumber || null;
      txGasUsed = txResult.gasUsed || null;
      txEffectiveGasPrice = txResult.effectiveGasPrice || null;

      if (txGasUsed && txEffectiveGasPrice) {
        try {
          const gasFeeBig = BigInt(txGasUsed) * BigInt(txEffectiveGasPrice);
          txGasFee = gasFeeBig.toString();
          txGasFeeEth = ethers.formatEther(gasFeeBig);
        } catch (feeErr) {
          console.warn('Failed to compute gas fee:', feeErr && feeErr.message ? feeErr.message : feeErr);
        }
      }
    }

    console.log('✅ Blockchain trade executed:', txHash);

    // Update database
    const t = await sequelize.transaction();
    try {
      const sellerOwner = sellerItem.owner;
      const sellerInventoryId = sellerItem.inventoryId;
      const currentTime = new Date();

      sellerItem.owner = buyerItem.owner;
      buyerItem.owner = sellerOwner;
      sellerItem.inventoryId = buyerItem.inventoryId;
      buyerItem.inventoryId = sellerInventoryId;
      sellerItem.inMarket = 0;
      buyerItem.inMarket = 0;

      // Update acquired time for both items
      sellerItem.obtainedAt = currentTime;
      buyerItem.obtainedAt = currentTime;

      await sellerItem.save({ transaction: t });
      await buyerItem.save({ transaction: t });
      
      // Create trade log BEFORE deleting listing (to satisfy foreign key constraint)
      await TradeLog.create({
        itemHash: sellerItem.itemHash,
        tradeItemHash: buyerItem.itemHash,
        fromUser: listing.seller,
        toUser: buyer,
        transactionHash: txHash,
        transactionType: 'TRADE',
        status: 'CONFIRMED',
        blockNumber: txBlockNumber,
        gasUsed: txGasUsed,
        gasFee: txGasFee,
        gasFeeEth: txGasFeeEth,
        fromWallet: sellerUser.walletAddress,
        toWallet: buyerUser.walletAddress,
        listingId: listingId
      }, { transaction: t });

      // Now delete the listing
      await MarketListing.destroy({ where: { listingId }, transaction: t });

      await t.commit();
      console.log('✅ Database updated');

      return res.json({ success: true, txHash });

    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }

  } catch (error) {
    console.error('❌ Execute trade failed:', error);
    return res.status(500).json({ 
      error: 'Failed to execute trade',
      details: error.message 
    });
  }
};

export default { prepareTrade, confirmTrade, executeTrade };
