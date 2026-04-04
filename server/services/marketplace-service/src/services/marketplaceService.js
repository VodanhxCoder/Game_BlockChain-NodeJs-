import db from '../../../shared/models/index.js';
import { ethers } from 'ethers';

const { sequelize, MarketListing, InventoryItem, Item, User } = db;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const mapListing = (listing) => ({
  listingId: listing.listingId,
  itemHash: listing.itemHash,
  tier: listing.tier,
  wantedItemId: listing.wantedItemId,
  createdAt: listing.createdAt,
  seller: listing.Seller
    ? {
        username: listing.Seller.username,
        playername: listing.Seller.playername,
        walletAddress: listing.Seller.walletAddress,
      }
    : null,
  inventoryItem: listing.InventoryItem
    ? {
        inventoryItemId: listing.InventoryItem.inventoryItemId,
        itemHash: listing.InventoryItem.itemHash,
        itemId: listing.InventoryItem.itemId,
        owner: listing.InventoryItem.owner,
        obtainedAt: listing.InventoryItem.obtainedAt,
        item: listing.InventoryItem.Item
          ? {
              itemId: listing.InventoryItem.Item.itemId,
              itemName: listing.InventoryItem.Item.name,
              itemImage: listing.InventoryItem.Item.imageUrl,
              itemTier: listing.InventoryItem.Item.rarity,
            }
          : null,
      }
    : null,
  wantedItem: listing.WantedItem
    ? {
        itemId: listing.WantedItem.itemId,
        name: listing.WantedItem.name,
        rarity: listing.WantedItem.rarity,
      }
    : null,
});

const getListings = async ({ limit = 20, page = 1 }) => {
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const listings = await MarketListing.findAll({
    include: [
      {
        model: InventoryItem,
        include: [{ model: Item, attributes: ['itemId', 'name', 'imageUrl', 'rarity'] }],
      },
      { model: Item, as: 'WantedItem', attributes: ['itemId', 'name', 'rarity'] },
      { model: User, as: 'Seller', attributes: ['username', 'playername', 'walletAddress'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset,
  });

  return {
    page: safePage,
    limit: safeLimit,
    listings: listings.map(mapListing),
  };
};

const getWantedItems = async () => {
  const items = await Item.findAll({
    attributes: ['itemId', 'name', 'imageUrl', 'rarity'],
    order: [['itemId', 'ASC']],
  });

  return {
    total: items.length,
    items: items.map((item) => ({
      itemId: item.itemId,
      name: item.name,
      imageUrl: item.imageUrl,
      rarity: item.rarity,
    })),
  };
};

const createListing = async ({ username, itemHash, wantedItemId = null, sellerSignature = null, sellerSignatureTimestamp = null }) => {
  if (!username || !itemHash) {
    throw createHttpError(400, 'username and itemHash are required');
  }

  const transaction = await sequelize.transaction();
  try {
    const sellerUser = await User.findOne({ where: { username }, transaction });
    if (!sellerUser || !sellerUser.walletAddress) {
      throw createHttpError(400, 'You must link your wallet before listing items.');
    }

    const inventoryItem = await InventoryItem.findOne({ where: { itemHash }, transaction });
    if (!inventoryItem) {
      throw createHttpError(404, 'Inventory item not found');
    }
    if (inventoryItem.owner !== username) {
      throw createHttpError(403, 'You do not own this item');
    }
    if (inventoryItem.inMarket) {
      throw createHttpError(400, 'Item is already listed');
    }

    const item = await Item.findOne({ where: { itemId: inventoryItem.itemId }, transaction });
    const tier = item && item.rarity ? item.rarity : 'Common';

    if (sellerSignature) {
      if (!sellerSignatureTimestamp) {
        throw createHttpError(400, 'sellerSignatureTimestamp required alongside sellerSignature');
      }

      try {
        const message = `Approve listing for item ${inventoryItem.itemHash} - timestamp: ${sellerSignatureTimestamp}`;
        const recovered = ethers.verifyMessage(message, sellerSignature);
        if (recovered.toLowerCase() !== sellerUser.walletAddress.toLowerCase()) {
          throw createHttpError(400, 'Invalid seller signature');
        }
      } catch (error) {
        if (error.status) {
          throw error;
        }
        throw createHttpError(400, 'Failed to verify seller signature');
      }
    }

    const listing = await MarketListing.create(
      {
        itemHash: inventoryItem.itemHash,
        wantedItemId: wantedItemId || null,
        seller: username,
        tier,
        createdAt: new Date(),
        sellerSignature,
        sellerSignatureTimestamp,
      },
      { transaction }
    );

    inventoryItem.inMarket = 1;
    await inventoryItem.save({ transaction });

    await transaction.commit();

    return {
      listingId: listing.listingId,
      itemHash: listing.itemHash,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const buyListing = async ({ listingId, buyer, buyerInventoryItemId }) => {
  if (!listingId || !buyer || !buyerInventoryItemId) {
    throw createHttpError(400, 'listingId, buyer and buyerInventoryItemId are required');
  }

  const transaction = await sequelize.transaction();
  try {
    const listing = await MarketListing.findOne({ where: { listingId }, transaction });
    if (!listing) {
      throw createHttpError(404, 'Listing not found');
    }
    if (listing.seller === buyer) {
      throw createHttpError(400, 'Seller cannot buy their own listing');
    }

    const sellerItem = await InventoryItem.findOne({ where: { itemHash: listing.itemHash }, transaction });
    if (!sellerItem) {
      throw createHttpError(404, 'Seller inventory item not found');
    }
    if (sellerItem.owner !== listing.seller) {
      throw createHttpError(400, 'Listing owner mismatch');
    }
    if (!sellerItem.inMarket) {
      throw createHttpError(400, 'Item is no longer listed');
    }

    const buyerItem = await InventoryItem.findOne({ where: { inventoryItemId: buyerInventoryItemId }, transaction });
    if (!buyerItem) {
      throw createHttpError(404, 'Buyer inventory item not found');
    }
    if (buyerItem.owner !== buyer) {
      throw createHttpError(403, 'You do not own the selected item');
    }
    if (buyerItem.inMarket) {
      throw createHttpError(400, 'Selected item is currently listed and cannot be used for trade');
    }

    if (listing.wantedItemId && buyerItem.itemId !== listing.wantedItemId) {
      throw createHttpError(400, 'Selected item does not match the requested wanted item');
    }

    const sellerOwner = sellerItem.owner;
    const sellerInventoryId = sellerItem.inventoryId;

    sellerItem.owner = buyerItem.owner;
    buyerItem.owner = sellerOwner;

    sellerItem.inventoryId = buyerItem.inventoryId;
    buyerItem.inventoryId = sellerInventoryId;

    sellerItem.inMarket = 0;
    buyerItem.inMarket = 0;

    await sellerItem.save({ transaction });
    await buyerItem.save({ transaction });

    await MarketListing.destroy({ where: { listingId }, transaction });

    await db.TradeLog.create(
      {
        itemHash: sellerItem.itemHash,
        fromUser: listing.seller,
        toUser: buyer,
        toInventoryId: buyerItem.inventoryId,
        listingId,
        transactionType: 'TRADE',
        status: 'CONFIRMED',
      },
      { transaction }
    );

    await transaction.commit();

    return {
      success: true,
      listingId,
      exchanged: {
        sellerItemId: sellerItem.inventoryItemId,
        buyerItemId: buyerItem.inventoryItemId,
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cancelListing = async ({ listingId, username }) => {
  if (!listingId || !username) {
    throw createHttpError(400, 'listingId and username are required');
  }

  const transaction = await sequelize.transaction();
  try {
    const listing = await MarketListing.findOne({ where: { listingId }, transaction });
    if (!listing) {
      throw createHttpError(404, 'Listing not found');
    }
    if (listing.seller !== username) {
      throw createHttpError(403, 'Only seller can cancel listing');
    }

    const inventoryItem = await InventoryItem.findOne({ where: { itemHash: listing.itemHash }, transaction });
    if (inventoryItem) {
      inventoryItem.inMarket = 0;
      await inventoryItem.save({ transaction });
    }

    await MarketListing.destroy({ where: { listingId }, transaction });
    await transaction.commit();

    return { success: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateSignature = async ({ listingId, sellerSignature, sellerSignatureTimestamp }) => {
  if (!listingId || !sellerSignature || !sellerSignatureTimestamp) {
    throw createHttpError(400, 'listingId, sellerSignature, and sellerSignatureTimestamp required');
  }

  const listing = await MarketListing.findOne({ where: { listingId } });
  if (!listing) {
    throw createHttpError(404, 'Listing not found');
  }

  listing.sellerSignature = sellerSignature;
  listing.sellerSignatureTimestamp = sellerSignatureTimestamp;
  await listing.save();

  return { success: true, listingId };
};

export default {
  getListings,
  getWantedItems,
  createListing,
  buyListing,
  cancelListing,
  updateSignature,
};
