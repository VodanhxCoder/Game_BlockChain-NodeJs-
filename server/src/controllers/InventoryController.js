// controllers/InventoryController.js
import db from "../models/index.js";
import { Op } from "sequelize";
import DropController from './DropController.js';
const User = db.User;
const Item = db.Item;
const Inventory = db.Inventory;
const InventoryItem = db.InventoryItem;
const DropPool = db.DropPool;

/**
 * Get user's inventory
 * @route GET /api/inventory/:username
 */
const getUserInventory = async (req, res) => {
  try {
    const { username } = req.params;

    // Verify user exists
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find user's inventory
    const inventory = await Inventory.findOne({
      where: { username }
    });

    if (!inventory) {
      // Return empty inventory if user has no inventory yet
      return res.status(200).json({
        username,
        totalItems: 0,
        inventory: []
      });
    }

    // Fetch user's items with item details
    const inventoryItems = await InventoryItem.findAll({
      where: { inventoryId: inventory.inventoryId },
      include: [{
        model: Item,
        attributes: ['itemId', 'name', 'imageUrl', 'rarity']
      }],
      order: [['obtainedAt', 'DESC']]
    });

    // Transform data for frontend
    const inventoryData = inventoryItems.map(ii => ({
      inventoryItemId: ii.inventoryItemId,
      itemHash: ii.itemHash,
      obtainedAt: ii.obtainedAt,
      inMarket: ii.inMarket || false,
      item: ii.Item ? {
        itemId: ii.Item.itemId,
        itemName: ii.Item.name,
        itemImage: ii.Item.imageUrl,
        itemTier: ii.Item.rarity
      } : null
    }));

    return res.status(200).json({
      username,
      totalItems: inventoryData.length,
      inventory: inventoryData
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

/**
 * Simulate item drop based on drop pool rates
 * @route POST /api/drop
 */
const simulateItemDrop = async (req, res) => {
  try {
    const { username, level = 1 } = req.body;

    console.log(`🎲 Drop request received - Username: ${username}, Level: ${level}`);

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Verify user exists
    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch all active drop pool entries with item details
    const dropPool = await DropPool.findAll({
      where: { active: true },
      include: [{
        model: Item,
        attributes: ['itemId', 'name', 'imageUrl', 'rarity']
      }]
    });

    console.log(`📦 Drop pool entries found: ${dropPool.length}`);

    if (dropPool.length === 0) {
      console.log('❌ Drop pool is empty!');
      return res.status(200).json({ 
        dropped: false, 
        message: 'No items in drop pool' 
      });
    }

    // Independent drop rate system: each item has its own chance to drop
    // Roll for each item separately, then pick one if any succeeded
    const droppedItems = [];
    
    for (const entry of dropPool) {
      const dropChance = parseFloat(entry.dropRate); // e.g., 25.00 means 25% independent chance
      const roll = Math.random() * 100; // Roll 0-100
      
      if (roll <= dropChance) {
        droppedItems.push(entry);
        console.log(`✅ Item rolled: ${entry.Item.name} (${entry.Item.rarity}) - roll: ${roll.toFixed(2)}% <= ${dropChance}%`);
      }
    }

    // If no items dropped, return no drop
    if (droppedItems.length === 0) {
      console.log(`🚫 No items dropped this time`);
      return res.status(200).json({ 
        dropped: false,
        message: 'No item dropped this time'
      });
    }

    // If one or more items dropped, pick one randomly
    const droppedEntry = droppedItems[Math.floor(Math.random() * droppedItems.length)];
    console.log(`✅ Item selected from ${droppedItems.length} drop(s): ${droppedEntry.Item.name} (${droppedEntry.Item.rarity})`);

    // Save directly to inventory without using DropController.simulateDrop
    // to avoid double-rolling with cumulative logic
    try {
      // Persist the exact selected item to inventory
      const createdInventoryItem = await DropController.saveCollectedItem(user.username, droppedEntry.Item.itemId);

      // Return the dropped item details
      return res.status(200).json({
        dropped: true,
        item: {
          itemId: droppedEntry.Item.itemId,
          itemName: droppedEntry.Item.name,
          itemImage: droppedEntry.Item.imageUrl,
          itemTier: droppedEntry.Item.rarity,
          itemHash: createdInventoryItem ? createdInventoryItem.itemHash : null,
          quantity: 1
        },
        inventoryItemId: createdInventoryItem ? createdInventoryItem.inventoryItemId : null,
        level,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error adding dropped item to inventory via DropController:', e);
      return res.status(500).json({ error: 'Failed to save dropped item to inventory' });
    }

  } catch (error) {
    console.error('Error simulating drop:', error);
    return res.status(500).json({ error: 'Failed to simulate drop' });
  }
};

/**
 * Get drop pool configuration (for admin/debug purposes)
 * @route GET /api/drop-pool
 */
const getDropPool = async (req, res) => {
  try {
    const dropPool = await DropPool.findAll({
      include: [{
        model: Item,
        attributes: ['itemId', 'name', 'imageUrl', 'rarity']
      }],
      order: [['dropRate', 'DESC']]
    });

    const formattedPool = dropPool.map(entry => ({
      dropId: entry.dropId,
      itemId: entry.itemId,
      dropRate: parseFloat(entry.dropRate),
      active: entry.active,
      item: entry.Item ? {
        itemId: entry.Item.itemId,
        itemName: entry.Item.name,
        itemImage: entry.Item.imageUrl,
        itemTier: entry.Item.rarity
      } : null
    }));

    return res.status(200).json({
      totalEntries: formattedPool.length,
      dropPool: formattedPool
    });
  } catch (error) {
    console.error('Error fetching drop pool:', error);
    return res.status(500).json({ error: 'Failed to fetch drop pool' });
  }
};

export default {
  getUserInventory,
  simulateItemDrop,
  getDropPool
};
