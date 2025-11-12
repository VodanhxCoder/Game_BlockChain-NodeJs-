// routes/inventory.js
const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');

/**
 * @route GET /api/inventory/:username
 * @desc Get user's inventory
 */
router.get('/inventory/:username', InventoryController.getUserInventory);

/**
 * @route POST /api/drop
 * @desc Simulate an item drop for a user
 * @body { username: string, level?: number }
 */
router.post('/drop', InventoryController.simulateItemDrop);

/**
 * @route GET /api/drop-pool
 * @desc Get current drop pool configuration
 */
router.get('/drop-pool', InventoryController.getDropPool);

module.exports = router;
