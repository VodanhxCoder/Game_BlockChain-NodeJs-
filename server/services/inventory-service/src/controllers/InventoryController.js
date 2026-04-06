import inventoryService from '../services/inventoryService.js';

/**
 * Get user's inventory
 * @route GET /api/inventory/:username
 */
const getUserInventory = async (req, res) => {
  try {
    const result = await inventoryService.getUserInventory(req.params);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
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
    const result = await inventoryService.simulateItemDrop(req.body);
    return res.status(200).json(result);

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
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
    const result = await inventoryService.getDropPool();
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error fetching drop pool:', error);
    return res.status(500).json({ error: 'Failed to fetch drop pool' });
  }
};

export default {
  getUserInventory,
  simulateItemDrop,
  getDropPool
};
