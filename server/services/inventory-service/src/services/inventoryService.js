import db from '../../../shared/models/index.js';
import DropController from '../controllers/DropController.js';

const { User, Item, Inventory, InventoryItem, DropPool } = db;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const getUserInventory = async ({ username }) => {
  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const inventory = await Inventory.findOne({ where: { username } });

  if (!inventory) {
    return {
      username,
      totalItems: 0,
      inventory: [],
    };
  }

  const inventoryItems = await InventoryItem.findAll({
    where: { inventoryId: inventory.inventoryId },
    include: [
      {
        model: Item,
        attributes: ['itemId', 'name', 'imageUrl', 'rarity'],
      },
    ],
    order: [['obtainedAt', 'DESC']],
  });

  const inventoryData = inventoryItems.map((ii) => ({
    inventoryItemId: ii.inventoryItemId,
    itemHash: ii.itemHash,
    obtainedAt: ii.obtainedAt,
    inMarket: ii.inMarket || false,
    item: ii.Item
      ? {
          itemId: ii.Item.itemId,
          itemName: ii.Item.name,
          itemImage: ii.Item.imageUrl,
          itemTier: ii.Item.rarity,
        }
      : null,
  }));

  return {
    username,
    totalItems: inventoryData.length,
    inventory: inventoryData,
  };
};

const simulateItemDrop = async ({ username, level = 1 }) => {
  if (!username) {
    throw createHttpError(400, 'Username is required');
  }

  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const dropPool = await DropPool.findAll({
    where: { active: true },
    include: [
      {
        model: Item,
        attributes: ['itemId', 'name', 'imageUrl', 'rarity'],
      },
    ],
  });

  if (dropPool.length === 0) {
    return {
      dropped: false,
      message: 'No items in drop pool',
    };
  }

  const droppedItems = [];
  for (const entry of dropPool) {
    const dropChance = parseFloat(entry.dropRate);
    const roll = Math.random() * 100;

    if (roll <= dropChance) {
      droppedItems.push(entry);
    }
  }

  if (droppedItems.length === 0) {
    return {
      dropped: false,
      message: 'No item dropped this time',
    };
  }

  const droppedEntry = droppedItems[Math.floor(Math.random() * droppedItems.length)];
  const createdInventoryItem = await DropController.saveCollectedItem(user.username, droppedEntry.Item.itemId);

  return {
    dropped: true,
    item: {
      itemId: droppedEntry.Item.itemId,
      itemName: droppedEntry.Item.name,
      itemImage: droppedEntry.Item.imageUrl,
      itemTier: droppedEntry.Item.rarity,
      itemHash: createdInventoryItem ? createdInventoryItem.itemHash : null,
      quantity: 1,
    },
    inventoryItemId: createdInventoryItem ? createdInventoryItem.inventoryItemId : null,
    level,
    timestamp: new Date().toISOString(),
  };
};

const getDropPool = async () => {
  const dropPool = await DropPool.findAll({
    include: [
      {
        model: Item,
        attributes: ['itemId', 'name', 'imageUrl', 'rarity'],
      },
    ],
    order: [['dropRate', 'DESC']],
  });

  const formattedPool = dropPool.map((entry) => ({
    dropId: entry.dropId,
    itemId: entry.itemId,
    dropRate: parseFloat(entry.dropRate),
    active: entry.active,
    item: entry.Item
      ? {
          itemId: entry.Item.itemId,
          itemName: entry.Item.name,
          itemImage: entry.Item.imageUrl,
          itemTier: entry.Item.rarity,
        }
      : null,
  }));

  return {
    totalEntries: formattedPool.length,
    dropPool: formattedPool,
  };
};

export default {
  getUserInventory,
  simulateItemDrop,
  getDropPool,
};
