import db from '../models/index.js';
import { ethers } from 'ethers';

const { sequelize, MarketListing, InventoryItem, Item, User } = db;

/**
 * GET /api/market/listings
 * Returns paginated marketplace listings joined with item and seller info
 */
const getListings = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const offset = (page - 1) * limit;

    const listings = await MarketListing.findAll({
      include: [
        // include the inventory item and its Item details so the client can show name/image
        { model: InventoryItem, include: [{ model: Item, attributes: ['itemId', 'name', 'imageUrl', 'rarity'] }] },
        { model: Item, as: 'WantedItem', attributes: ['itemId', 'name', 'rarity'] },
        { model: User, as: 'Seller', attributes: ['username', 'playername', 'walletAddress'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const formatted = listings.map(l => ({
      listingId: l.listingId,
      itemHash: l.itemHash,
      tier: l.tier,
      wantedItemId: l.wantedItemId,
      createdAt: l.createdAt,
      seller: l.Seller ? { username: l.Seller.username, playername: l.Seller.playername, walletAddress: l.Seller.walletAddress } : null,
      inventoryItem: l.InventoryItem ? {
        inventoryItemId: l.InventoryItem.inventoryItemId,
        itemHash: l.InventoryItem.itemHash,
        itemId: l.InventoryItem.itemId,
        owner: l.InventoryItem.owner,
        obtainedAt: l.InventoryItem.obtainedAt,
        item: l.InventoryItem.Item ? {
          itemId: l.InventoryItem.Item.itemId,
          itemName: l.InventoryItem.Item.name,
          itemImage: l.InventoryItem.Item.imageUrl,
          itemTier: l.InventoryItem.Item.rarity
        } : null
      } : null,
      wantedItem: l.WantedItem ? { itemId: l.WantedItem.itemId, name: l.WantedItem.name, rarity: l.WantedItem.rarity } : null
    }));

    return res.json({ page, limit, listings: formatted });
  } catch (err) {
    console.error('Error fetching market listings', err);
    return res.status(500).json({ error: 'Failed to fetch market listings' });
  }
};

/**
 * POST /api/market/list
 * Body: { username, itemHash, wantedItemId? }
 * Creates a market listing for an inventory item owned by the user
 */
const createListing = async (req, res) => {
  const { username, itemHash, wantedItemId = null } = req.body;
  if (!username || !itemHash) return res.status(400).json({ error: 'username and itemHash are required' });

  const t = await sequelize.transaction();
  try {
    // locate inventory item and verify owner
    const ii = await InventoryItem.findOne({ where: { itemHash } });
    if (!ii) {
      await t.rollback();
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    if (ii.owner !== username) {
      await t.rollback();
      return res.status(403).json({ error: 'You do not own this item' });
    }
    if (ii.inMarket) {
      await t.rollback();
      return res.status(400).json({ error: 'Item is already listed' });
    }

  // derive tier from associated Item if available (use string enum values)
  const item = await Item.findOne({ where: { itemId: ii.itemId } });
  const tier = item && item.rarity ? item.rarity : 'Common';

    // Allow optional sellerSignature (signed by seller wallet) and verify if present
    const sellerSignature = req.body.sellerSignature || null;

    const sellerSignatureTs = req.body.sellerSignatureTimestamp || req.body.sellerSignatureTs || null;
    if (sellerSignature) {
      // Verify signature matches seller's linked wallet (if available)
      const sellerUser = await User.findOne({ where: { username } });
      if (!sellerUser || !sellerUser.walletAddress) {
        await t.rollback();
        return res.status(400).json({ error: 'Seller wallet address required to accept on-chain buyer-initiated trades' });
      }
      try {
        if (!sellerSignatureTs) {
          await t.rollback();
          return res.status(400).json({ error: 'sellerSignatureTimestamp required alongside sellerSignature' });
        }
        // Seller signs a simple approval message (not contract-specific yet)
        const message = `Approve listing for item ${ii.itemHash} - timestamp: ${sellerSignatureTs}`;
        const recovered = ethers.verifyMessage(message, sellerSignature);
        if (recovered.toLowerCase() !== sellerUser.walletAddress.toLowerCase()) {
          await t.rollback();
          return res.status(400).json({ error: 'Invalid seller signature' });
        }
      } catch (sigErr) {
        await t.rollback();
        console.error('Signature verification error:', sigErr && sigErr.message ? sigErr.message : sigErr);
        return res.status(400).json({ error: 'Failed to verify seller signature' });
      }
    }

    const listing = await MarketListing.create({
      itemHash: ii.itemHash,
      wantedItemId: wantedItemId || null,
      seller: username,
      tier,
      createdAt: new Date(),
      sellerSignature: sellerSignature,
      sellerSignatureTimestamp: sellerSignatureTs
    }, { transaction: t });

    // mark inventory item as in_market
    ii.inMarket = 1;
    await ii.save({ transaction: t });

    await t.commit();
    
    return res.status(201).json({ listingId: listing.listingId, itemHash: listing.itemHash });
  } catch (err) {
    await t.rollback();
    console.error('Error creating listing', err);
    return res.status(500).json({ error: 'Failed to create listing' });
  }
};

/**
 * POST /api/market/buy
 * Body: { listingId, buyer }
 * Transfers ownership of the inventory item and removes the listing
 */
const buyListing = async (req, res) => {
  // Expecting: { listingId, buyer, buyerInventoryItemId }
  const { listingId, buyer, buyerInventoryItemId } = req.body;
  if (!listingId || !buyer || !buyerInventoryItemId) return res.status(400).json({ error: 'listingId, buyer and buyerInventoryItemId are required' });

  const t = await sequelize.transaction();
  try {
    // Load listing and associated seller inventory item
    const listing = await MarketListing.findOne({ where: { listingId }, transaction: t });
    if (!listing) {
      await t.rollback();
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.seller === buyer) {
      await t.rollback();
      return res.status(400).json({ error: 'Seller cannot buy their own listing' });
    }

    // Seller's inventory item
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

    // Buyer's chosen inventory item
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

    // If seller requested a specific wanted_item_id, enforce it
    if (listing.wantedItemId && buyerItem.itemId !== listing.wantedItemId) {
      await t.rollback();
      return res.status(400).json({ error: 'Selected item does not match the requested wanted item' });
    }

    // Perform atomic swap of owner and inventoryId between sellerItem and buyerItem
    const sellerOwner = sellerItem.owner;
    const sellerInventoryId = sellerItem.inventoryId;

    // swap owners
    sellerItem.owner = buyerItem.owner;
    buyerItem.owner = sellerOwner;

    // swap inventory containers
    sellerItem.inventoryId = buyerItem.inventoryId;
    buyerItem.inventoryId = sellerInventoryId;

    // seller's listed item is no longer in market; buyer's item should remain not in market
    sellerItem.inMarket = 0;
    buyerItem.inMarket = 0;

    await sellerItem.save({ transaction: t });
    await buyerItem.save({ transaction: t });

    // remove listing
    await MarketListing.destroy({ where: { listingId }, transaction: t });

    // Log the trade (for legacy buyListing endpoint - blockchain trades use TradeController)
    await db.TradeLog.create({
      itemHash: sellerItem.itemHash,
      fromUser: listing.seller,
      toUser: buyer,
      toInventoryId: buyerItem.inventoryId,
      listingId: listingId,
      transactionType: 'TRADE',
      status: 'CONFIRMED'
    }, { transaction: t });

    await t.commit();

    return res.json({ success: true, listingId, exchanged: { sellerItemId: sellerItem.inventoryItemId, buyerItemId: buyerItem.inventoryItemId } });
  } catch (err) {
    await t.rollback();
    console.error('Error buying listing', err);
    return res.status(500).json({ error: 'Failed to buy listing' });
  }
};

/**
 * POST /api/market/cancel
 * Body: { listingId, username }
 * Allow seller to cancel their listing
 */
const cancelListing = async (req, res) => {
  const { listingId, username } = req.body;
  if (!listingId || !username) return res.status(400).json({ error: 'listingId and username are required' });

  const t = await sequelize.transaction();
  try {
    const listing = await MarketListing.findOne({ where: { listingId }, transaction: t });
    if (!listing) {
      await t.rollback();
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.seller !== username) {
      await t.rollback();
      return res.status(403).json({ error: 'Only seller can cancel listing' });
    }

    // unset inMarket on inventory item
    const ii = await InventoryItem.findOne({ where: { itemHash: listing.itemHash }, transaction: t });
    if (ii) {
      ii.inMarket = 0;
      await ii.save({ transaction: t });
    }

    await MarketListing.destroy({ where: { listingId }, transaction: t });

    await t.commit();
    return res.json({ success: true });
  } catch (err) {
    await t.rollback();
    console.error('Error cancelling listing', err);
    return res.status(500).json({ error: 'Failed to cancel listing' });
  }
};

export default {
  getListings,
  // Return a list of items that a seller can choose as their wanted item
  getWantedItems: async (req, res) => {
    try {
      const items = await Item.findAll({ attributes: ['itemId', 'name', 'imageUrl', 'rarity'], order: [['itemId', 'ASC']] });
      const formatted = items.map(i => ({ itemId: i.itemId, name: i.name, imageUrl: i.imageUrl, rarity: i.rarity }));
      return res.json({ total: formatted.length, items: formatted });
    } catch (err) {
      console.error('Error fetching wanted items', err);
      return res.status(500).json({ error: 'Failed to fetch items' });
    }
  },
  createListing,
  buyListing,
  cancelListing,
  updateSignature: async (req, res) => {
    const { listingId, sellerSignature, sellerSignatureTimestamp } = req.body;
    if (!listingId || !sellerSignature || !sellerSignatureTimestamp) {
      return res.status(400).json({ error: 'listingId, sellerSignature, and sellerSignatureTimestamp required' });
    }
    
    try {
      const listing = await MarketListing.findOne({ where: { listingId } });
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      
      // Update the listing with signature
      listing.sellerSignature = sellerSignature;
      listing.sellerSignatureTimestamp = sellerSignatureTimestamp;
      await listing.save();
      
      return res.json({ success: true, listingId });
    } catch (err) {
      console.error('Error updating signature', err);
      return res.status(500).json({ error: 'Failed to update signature' });
    }
  }
};
