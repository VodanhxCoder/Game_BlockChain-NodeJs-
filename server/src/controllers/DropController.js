const db = require("../models");
const { Op } = require("sequelize");
const crypto = require("crypto");
const DropPool = db.DropPool;
const InventoryItem = db.InventoryItem;
const Inventory = db.Inventory;
const User = db.User;

/**
 * Generate a unique item hash using SHA-256
 * Format: SHA2(CONCAT(item_id, ':', unix_timestamp, ':', random))
 */
function generateItemHash(itemId) {
  const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
  const randomValue = Math.random();
  const hashInput = `${itemId}:${timestamp}:${randomValue}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Simulates an item drop based on the drop rate.
 * @param {string} username - The username of the player.
 * @returns {Promise<object>} - The dropped item details or null if no item dropped.
 */
async function simulateDrop(username) {
  try {
    // Fetch all active drop pool entries
    const dropPool = await DropPool.findAll({
      where: { active: true },
    });

    // Calculate cumulative drop rates
    const cumulativeRates = [];
    let cumulativeSum = 0;
    dropPool.forEach((entry) => {
      cumulativeSum += parseFloat(entry.dropRate);
      cumulativeRates.push({
        itemId: entry.itemId,
        cumulativeRate: cumulativeSum,
      });
    });

    // Generate a random number between 0 and the total cumulative rate
    const randomRoll = Math.random() * cumulativeSum;

    // Determine which item (if any) is dropped
    const droppedItem = cumulativeRates.find(
      (entry) => randomRoll <= entry.cumulativeRate
    );

    if (!droppedItem) {
      return null; // No item dropped
    }

    // Verify user exists
    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new Error("User not found.");
    }

    // Find or create the user's inventory
    let inventory = await Inventory.findOne({
      where: { username },
    });

    if (!inventory) {
      // Create inventory for user if it doesn't exist
      inventory = await Inventory.create({
        username: username
      });
      console.log(`✅ Created new inventory for user: ${username}`);
    }

    // Generate unique item hash for this drop
    const itemHash = generateItemHash(droppedItem.itemId);

    // Add the dropped item to the player's inventory with item_hash
    const newItem = await InventoryItem.create({
      inventoryId: inventory.inventoryId,
      itemId: droppedItem.itemId,
      owner: username,
      itemHash: itemHash,
      obtainedAt: new Date()
    });

    console.log(`✅ Item added to inventory with hash: ${itemHash}`);

    return newItem;
  } catch (error) {
    console.error("Error simulating drop:", error);
    throw error;
  }
}

module.exports = { simulateDrop };