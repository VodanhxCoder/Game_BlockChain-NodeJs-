// src/routes/inventory.js
import express from 'express';
import InventoryController from '../controllers/InventoryController.js';
import authJwt from '../../../shared/middleware/authJwt.js';

const router = express.Router();

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
router.post('/drop', authJwt.verifyToken, InventoryController.simulateItemDrop);

/**
 * @route GET /api/drop-pool
 * @desc Get current drop pool configuration
 */
router.get('/drop-pool', InventoryController.getDropPool);

export default router;
