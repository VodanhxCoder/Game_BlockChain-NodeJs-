import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { ethers } = require('ethers');
import db from '../../../shared/models/index.js';
import HardhatBlockchainService from '../../../shared/blockchain/HardhatBlockchainService.js';

const { sequelize, InventoryItem, MarketListing, User, TradeLog } = db;

const createHttpError = (status, message, details = null) => {
  const error = new Error(message);
  error.status = status;
  if (details) {
    error.details = details;
  }
  return error;
};

const prepareTrade = async ({ listingId, buyer, buyerInventoryItemId, buyerWallet }) => {
  if (!listingId || !buyer || !buyerInventoryItemId || !buyerWallet) {
    throw createHttpError(400, 'listingId, buyer, buyerInventoryItemId and buyerWallet are required');
  }

  const listing = await MarketListing.findOne({ where: { listingId } });
  if (!listing) {
    throw createHttpError(404, 'Listing not found');
  }
  if (listing.seller === buyer) {
    throw createHttpError(400, 'Seller cannot buy their own listing');
  }

  const sellerItem = await InventoryItem.findOne({ where: { itemHash: listing.itemHash } });
  if (!sellerItem) {
    throw createHttpError(404, 'Seller inventory item not found');
  }
  if (sellerItem.owner !== listing.seller) {
    throw createHttpError(400, 'Listing owner mismatch');
  }
  if (!sellerItem.inMarket) {
    throw createHttpError(400, 'Item is no longer listed');
  }

  const buyerItem = await InventoryItem.findOne({ where: { inventoryItemId: buyerInventoryItemId } });
  if (!buyerItem) {
    throw createHttpError(404, 'Buyer inventory item not found');
  }
  if (buyerItem.owner !== buyer) {
    throw createHttpError(403, 'You do not own the selected item');
  }
  if (buyerItem.inMarket) {
    throw createHttpError(400, 'Selected item is currently listed and cannot be used for trade');
  }

  const sellerUser = await User.findOne({ where: { username: listing.seller } });
  if (!sellerUser || !sellerUser.walletAddress) {
    throw createHttpError(400, `Seller (${listing.seller}) wallet address not found. Please contact seller to link their wallet.`);
  }

  const buyerUser = await User.findOne({ where: { username: buyer } });
  if (!buyerUser || !buyerUser.walletAddress) {
    throw createHttpError(400, 'Buyer wallet address not found. Please link your wallet first.');
  }

  const sellerMinted = await HardhatBlockchainService.isItemMinted(listing.itemHash);
  if (!sellerMinted) {
    try {
      await HardhatBlockchainService.mintItem(
        listing.itemHash,
        sellerUser.walletAddress,
        sellerItem.itemName || 'Game Item',
        sellerItem.tier || 'Common',
        listing.seller
      );
    } catch (error) {
      throw createHttpError(500, 'Failed to mint seller item as NFT', error.message);
    }
  }

  const buyerMinted = await HardhatBlockchainService.isItemMinted(buyerItem.itemHash);
  if (!buyerMinted) {
    try {
      await HardhatBlockchainService.mintItem(
        buyerItem.itemHash,
        buyerUser.walletAddress,
        buyerItem.itemName || 'Game Item',
        buyerItem.tier || 'Common',
        buyer
      );
    } catch (error) {
      throw createHttpError(500, 'Failed to mint buyer item as NFT', error.message);
    }
  }

  try {
    const sellerOwnership = await HardhatBlockchainService.verifyOwnership(listing.itemHash, sellerUser.walletAddress);
    const buyerOwnership = await HardhatBlockchainService.verifyOwnership(buyerItem.itemHash, buyerUser.walletAddress);

    if (!sellerOwnership) {
      try {
        await HardhatBlockchainService.transferToCorrectOwner(listing.itemHash, sellerUser.walletAddress);
      } catch (error) {
        throw createHttpError(400, 'Seller does not own the NFT for this item', 'The item was minted to a different wallet. Please contact support.');
      }
    }

    if (!buyerOwnership) {
      try {
        await HardhatBlockchainService.transferToCorrectOwner(buyerItem.itemHash, buyerUser.walletAddress);
      } catch (error) {
        throw createHttpError(400, 'Buyer does not own the NFT for the selected item', 'The item was minted to a different wallet. Please contact support.');
      }
    }
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw createHttpError(500, 'Failed to verify NFT ownership', error.message);
  }

  let contractJson;
  try {
    const contractPath = path.resolve(__dirname, '../../../../artifacts/contracts/ItemTradingNFT.sol/ItemTradingNFT.json');
    contractJson = require(contractPath);
  } catch (error) {
    throw createHttpError(
      500,
      'Smart contract not deployed. Please deploy the contract first.',
      'Run: npx hardhat run scripts/deploy-contract.js --network localhost'
    );
  }

  const iface = new ethers.Interface(contractJson.abi);
  const sellerHashBytes = '0x' + listing.itemHash;
  const buyerHashBytes = '0x' + buyerItem.itemHash;

  const data = iface.encodeFunctionData('executeTrade', [
    sellerHashBytes,
    buyerHashBytes,
    sellerUser.walletAddress,
    buyerUser.walletAddress,
  ]);

  const contractAddress =
    HardhatBlockchainService.contractAddress ||
    process.env.CONTRACT_ADDRESS ||
    process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw createHttpError(500, 'Contract address not configured. Please set CONTRACT_ADDRESS in .env file.');
  }

  return {
    contractAddress,
    data,
    value: '0x0',
    listingId,
    seller: listing.seller,
    sellerWallet: sellerUser.walletAddress,
    buyerWallet: buyerUser.walletAddress,
    sellerItemHash: listing.itemHash,
    buyerItemHash: buyerItem.itemHash,
    sellerSignature: listing.sellerSignature || null,
    sellerSignatureTimestamp: listing.sellerSignatureTimestamp || null,
  };
};

const confirmTrade = async ({ txHash, listingId, buyer, buyerInventoryItemId }) => {
  if (!txHash || !listingId || !buyer || !buyerInventoryItemId) {
    throw createHttpError(400, 'txHash, listingId, buyer and buyerInventoryItemId are required');
  }

  const txInfo = await HardhatBlockchainService.getTransaction(txHash);
  if (!txInfo || !txInfo.receipt) {
    throw createHttpError(404, 'Transaction not found yet');
  }

  const receipt = txInfo.receipt;
  if (receipt.status !== 1 && receipt.status !== '0x1') {
    await TradeLog.create({
      itemHash: listingId,
      fromUser: null,
      toUser: buyer,
      transactionHash: txHash,
      transactionType: 'TRADE',
      status: 'FAILED',
      errorMessage: 'On-chain tx failed',
      metadata: JSON.stringify({ receipt }),
    });
    throw createHttpError(400, 'On-chain transaction failed');
  }

  const t = await sequelize.transaction();
  try {
    const listing = await MarketListing.findOne({ where: { listingId }, transaction: t });
    if (!listing) {
      throw createHttpError(404, 'Listing not found');
    }

    const sellerItem = await InventoryItem.findOne({ where: { itemHash: listing.itemHash }, transaction: t });
    if (!sellerItem) {
      throw createHttpError(404, 'Seller inventory item not found');
    }
    if (sellerItem.owner !== listing.seller) {
      throw createHttpError(400, 'Listing owner mismatch');
    }
    if (!sellerItem.inMarket) {
      throw createHttpError(400, 'Item is no longer listed');
    }

    const buyerItem = await InventoryItem.findOne({ where: { inventoryItemId: buyerInventoryItemId }, transaction: t });
    if (!buyerItem) {
      throw createHttpError(404, 'Buyer inventory item not found');
    }
    if (buyerItem.owner !== buyer) {
      throw createHttpError(403, 'You do not own the selected item');
    }
    if (buyerItem.inMarket) {
      throw createHttpError(400, 'Selected item is currently listed and cannot be used for trade');
    }

    const sellerOwner = sellerItem.owner;
    const sellerInventoryId = sellerItem.inventoryId;
    const currentTime = new Date();

    sellerItem.owner = buyerItem.owner;
    buyerItem.owner = sellerOwner;
    sellerItem.inventoryId = buyerItem.inventoryId;
    buyerItem.inventoryId = sellerInventoryId;
    sellerItem.inMarket = 0;
    buyerItem.inMarket = 0;
    sellerItem.obtainedAt = currentTime;
    buyerItem.obtainedAt = currentTime;

    await sellerItem.save({ transaction: t });
    await buyerItem.save({ transaction: t });

    const gasUsedStr = receipt.gasUsed ? receipt.gasUsed.toString() : null;
    const effectiveGasPriceStr = receipt.effectiveGasPrice
      ? receipt.effectiveGasPrice.toString()
      : (receipt.gasPrice ? receipt.gasPrice.toString() : null);

    let gasFeeWei = null;
    let gasFeeEth = null;
    if (gasUsedStr && effectiveGasPriceStr) {
      try {
        const feeBig = BigInt(gasUsedStr) * BigInt(effectiveGasPriceStr);
        gasFeeWei = feeBig.toString();
        gasFeeEth = ethers.formatEther(feeBig);
      } catch (_) {
        gasFeeWei = null;
        gasFeeEth = null;
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
      gasFeeEth,
      fromWallet: receipt.from || null,
      toWallet: receipt.to || null,
      listingId,
      metadata: JSON.stringify({ receipt }),
    }, { transaction: t });

    await MarketListing.destroy({ where: { listingId }, transaction: t });
    await t.commit();

    return {
      success: true,
      txHash,
      tradeLogId: tradeLog.tradeId,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const executeTrade = async ({ listingId, buyer, buyerInventoryItemId, buyerWallet, signature, message }) => {
  if (!listingId || !buyer || !buyerInventoryItemId || !buyerWallet || !signature || !message) {
    throw createHttpError(
      400,
      'Missing required fields: listingId, buyer, buyerInventoryItemId, buyerWallet, signature, message'
    );
  }

  const recoveredAddress = ethers.verifyMessage(message, signature);
  if (recoveredAddress.toLowerCase() !== buyerWallet.toLowerCase()) {
    throw createHttpError(403, 'Invalid signature');
  }

  const listing = await MarketListing.findOne({ where: { listingId } });
  if (!listing) {
    throw createHttpError(404, 'Listing not found');
  }
  if (listing.seller === buyer) {
    throw createHttpError(400, 'Cannot trade with yourself');
  }

  const sellerItem = await InventoryItem.findOne({ where: { itemHash: listing.itemHash } });
  if (!sellerItem) {
    throw createHttpError(404, 'Seller item not found');
  }

  const buyerItem = await InventoryItem.findOne({ where: { inventoryItemId: buyerInventoryItemId } });
  if (!buyerItem) {
    throw createHttpError(404, 'Buyer item not found');
  }
  if (buyerItem.owner !== buyer) {
    throw createHttpError(403, 'You do not own the selected item');
  }

  const sellerUser = await User.findOne({ where: { username: listing.seller } });
  const buyerUser = await User.findOne({ where: { username: buyer } });
  if (!sellerUser?.walletAddress || !buyerUser?.walletAddress) {
    throw createHttpError(400, 'Wallet addresses not found');
  }

  const sellerMinted = await HardhatBlockchainService.isItemMinted(listing.itemHash);
  if (!sellerMinted) {
    await HardhatBlockchainService.mintItem(
      listing.itemHash,
      sellerUser.walletAddress,
      sellerItem.itemName || 'Game Item',
      sellerItem.tier || 'Common',
      listing.seller
    );
  }

  const buyerMinted = await HardhatBlockchainService.isItemMinted(buyerItem.itemHash);
  if (!buyerMinted) {
    await HardhatBlockchainService.mintItem(
      buyerItem.itemHash,
      buyerUser.walletAddress,
      buyerItem.itemName || 'Game Item',
      buyerItem.tier || 'Common',
      buyer
    );
  }

  const sellerOwns = await HardhatBlockchainService.verifyOwnership(listing.itemHash, sellerUser.walletAddress);
  if (!sellerOwns) {
    throw createHttpError(
      400,
      'Seller NFT ownership mismatch',
      `Expected wallet: ${sellerUser.walletAddress}`
    );
  }

  const buyerOwns = await HardhatBlockchainService.verifyOwnership(buyerItem.itemHash, buyerUser.walletAddress);
  if (!buyerOwns) {
    throw createHttpError(
      400,
      'Buyer NFT ownership mismatch',
      `Expected wallet: ${buyerUser.walletAddress}`
    );
  }

  const txResult = await HardhatBlockchainService.executeTrade(
    listing.itemHash,
    buyerItem.itemHash,
    sellerUser.walletAddress,
    buyerUser.walletAddress,
    listingId,
    listing.seller,
    buyer
  );

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
      } catch (_) {
        txGasFee = null;
        txGasFeeEth = null;
      }
    }
  }

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
    sellerItem.obtainedAt = currentTime;
    buyerItem.obtainedAt = currentTime;

    await sellerItem.save({ transaction: t });
    await buyerItem.save({ transaction: t });

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
      listingId,
    }, { transaction: t });

    await MarketListing.destroy({ where: { listingId }, transaction: t });
    await t.commit();

    return { success: true, txHash };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export default {
  prepareTrade,
  confirmTrade,
  executeTrade,
};
