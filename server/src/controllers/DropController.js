const db = require("../models");
const { Op } = require("sequelize");
const DropPool = db.DropPool;
const InventoryItem = db.InventoryItem;
const Inventory = db.Inventory;

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
      cumulativeSum += parseFloat(entry.drop_rate);
      cumulativeRates.push({
        item_id: entry.item_id,
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

    // Find the player's inventory
    const inventory = await Inventory.findOne({
      where: { username },
    });

    if (!inventory) {
      throw new Error("Player inventory not found.");
    }

    // Add the dropped item to the player's inventory
    const newItem = await InventoryItem.create({
      inventory_id: inventory.inventory_id,
      item_id: droppedItem.item_id,
      owner: username,
    });

    return newItem;
  } catch (error) {
    console.error("Error simulating drop:", error);
    throw error;
  }
}

module.exports = { simulateDrop };