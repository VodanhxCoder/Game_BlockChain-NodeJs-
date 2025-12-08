// routes/admin.js - Admin-only routes
import express from 'express';
import db from '../models/index.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authJwt from '../middleware/authJwt.js';

const { Item, DropPool, User, Inventory, InventoryItem } = db;

// Compute uploads directory path (server/uploads)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

// Accept images (including GIF). Increase size limit to 10MB to allow small animations.
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });

const router = express.Router();

// Apply JWT verification to all admin routes
router.use(authJwt.verifyToken);

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  // authJwt.verifyToken already ensures req.user is set
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin only' });
  }
  next();
};

// Apply admin middleware to all routes
router.use([authJwt.verifyToken, requireAdmin]);

/**
 * POST /api/admin/upload
 * Upload a single image file and save to server/uploads
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({ url: publicUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * GET /api/admin/items
 * Get all items with their drop pool data
 */
router.get('/items', async (req, res) => {
  try {
    const items = await Item.findAll({
      include: [{
        model: DropPool,
        attributes: ['dropId', 'dropRate', 'active']
      }],
      order: [['itemId', 'ASC']]
    });

    // Transform data to include drop pool info at item level
    const itemsWithDropData = items.map(item => {
      const dropPool = item.DropPools && item.DropPools[0];
      return {
        itemId: item.itemId,
        name: item.name || 'Unknown',
        imageUrl: item.imageUrl || '',
        rarity: item.rarity || 'Common',
        dropRate: dropPool ? parseFloat(dropPool.dropRate) : 0,
        active: dropPool ? dropPool.active : true,
        dropId: dropPool ? dropPool.dropId : null,
        createdAt: item.createdAt
      };
    });

    res.json(itemsWithDropData);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * GET /api/admin/items/all
 * Get all items with their drop pool data (drop rate and active state)
 */
router.get('/items/all', async (req, res) => {
  try {
    const items = await Item.findAll({
      attributes: ['itemId', 'name', 'imageUrl', 'rarity', 'createdAt'],
      include: [{
        model: DropPool,
        attributes: ['dropId', 'dropRate', 'active'],
        required: false
      }],
      order: [['itemId', 'ASC']]
    });

    // Transform to include drop pool data at item level
    const itemsWithDropData = items.map(item => {
      const dropPool = item.DropPools && item.DropPools[0];
      return {
        itemId: item.itemId,
        name: item.name || 'Unknown',
        imageUrl: item.imageUrl || '',
        rarity: item.rarity || 'Common',
        dropRate: dropPool ? parseFloat(dropPool.dropRate) : null,
        active: dropPool ? dropPool.active : null,
        dropId: dropPool ? dropPool.dropId : null,
        createdAt: item.createdAt
      };
    });

    res.json({ total: itemsWithDropData.length, items: itemsWithDropData });
  } catch (error) {
    console.error('Error fetching all items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * POST /api/admin/items
 * Create a new item with drop pool data
 */
router.post('/items', async (req, res) => {
  const { name, imageUrl, rarity, dropRate, active } = req.body;

  try {
    // Validate input
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Item name must be at least 3 characters' });
    }

    if (!['Common', 'Rare', 'Legendary'].includes(rarity)) {
      return res.status(400).json({ error: 'Invalid rarity. Must be Common, Rare, or Legendary' });
    }

    if (dropRate !== undefined && (dropRate < 0 || dropRate > 100)) {
      return res.status(400).json({ error: 'Drop rate must be between 0 and 100' });
    }

    // Create new item
    const newItem = await Item.create({
      name: name.trim(),
      imageUrl: imageUrl || null,
      rarity
    });

    // Create drop pool entry
    const newDropPool = await DropPool.create({
      itemId: newItem.itemId,
      dropRate: dropRate || 1.0,
      active: active !== undefined ? active : true
    });

    const response = {
      itemId: newItem.itemId,
      name: newItem.name,
      imageUrl: newItem.imageUrl || '',
      rarity: newItem.rarity,
      dropRate: parseFloat(newDropPool.dropRate),
      active: newDropPool.active,
      dropId: newDropPool.dropId,
      createdAt: newItem.createdAt
    };

    res.status(201).json({ message: 'Item created successfully', item: response });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

/**
 * PUT /api/admin/items/:itemId
 * Update item details and drop pool
 */
router.put('/items/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { name, imageUrl, rarity, dropRate, active } = req.body;

  try {
    // Validate input
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Item name must be at least 3 characters' });
    }

    if (!['Common', 'Rare', 'Legendary'].includes(rarity)) {
      return res.status(400).json({ error: 'Invalid rarity. Must be Common, Rare, or Legendary' });
    }

    if (dropRate !== undefined && (dropRate < 0 || dropRate > 100)) {
      return res.status(400).json({ error: 'Drop rate must be between 0 and 100' });
    }

    // Update item
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.update({
      name: name.trim(),
      imageUrl: imageUrl || item.imageUrl,
      rarity
    });

    // Update or create drop pool entry
    if (dropRate !== undefined || active !== undefined) {
      const [dropPool, created] = await DropPool.findOrCreate({
        where: { itemId },
        defaults: {
          itemId,
          dropRate: dropRate || 1.0,
          active: active !== undefined ? active : true
        }
      });

      if (!created) {
        await dropPool.update({
          ...(dropRate !== undefined && { dropRate }),
          ...(active !== undefined && { active })
        });
      }
    }

    // Fetch updated item with drop pool
    const updatedItem = await Item.findByPk(itemId, {
      include: [{
        model: DropPool,
        attributes: ['dropId', 'dropRate', 'active']
      }]
    });

    const dropPool = updatedItem.DropPools && updatedItem.DropPools[0];
    const response = {
      itemId: updatedItem.itemId,
      name: updatedItem.name || 'Unknown',
      imageUrl: updatedItem.imageUrl || '',
      rarity: updatedItem.rarity || 'Common',
      dropRate: dropPool ? parseFloat(dropPool.dropRate) : 0,
      active: dropPool ? dropPool.active : true,
      dropId: dropPool ? dropPool.dropId : null,
      createdAt: updatedItem.createdAt
    };

    res.json({ message: 'Item updated successfully', item: response });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

/**
 * POST /api/admin/populate-drop-pool
 * Populate the drop pool table with default rates for all items
 */
router.post('/populate-drop-pool', async (req, res) => {
  try {
    // Get all items
    const items = await Item.findAll();
    
    if (items.length === 0) {
      return res.status(400).json({ error: 'No items found. Please add items first.' });
    }

    // Define default drop rates based on rarity
    const defaultDropRates = {
      'Common': 60.0,
      'Rare': 30.0,
      'Legendary': 10.0
    };

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Populate drop pool for each item
    for (const item of items) {
      const defaultRate = defaultDropRates[item.rarity] || 1.0;
      
      const [dropPool, wasCreated] = await DropPool.findOrCreate({
        where: { itemId: item.itemId },
        defaults: {
          itemId: item.itemId,
          dropRate: defaultRate,
          active: true
        }
      });

      if (wasCreated) {
        created++;
      } else {
        // Optionally update existing entries
        if (dropPool.dropRate === null || dropPool.dropRate === 0) {
          await dropPool.update({ dropRate: defaultRate });
          updated++;
        } else {
          skipped++;
        }
      }
    }

    res.json({
      message: 'Drop pool populated successfully',
      summary: {
        total: items.length,
        created,
        updated,
        skipped
      }
    });
  } catch (error) {
    console.error('Error populating drop pool:', error);
    res.status(500).json({ error: 'Failed to populate drop pool' });
  }
});

/**
 * GET /api/admin/users
 * Get all users with their stats
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'username', 
        'email', 
        'playername', 
        'userImage', 
        'role', 
        'status', 
        'highScore', 
        'walletAddress', 
        'provider',
        'created_at'
      ],
      order: [['created_at', 'DESC']]
    });

    // Get inventory item counts for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const inventory = await Inventory.findOne({ where: { username: user.username } });
      let itemCount = 0;
      
      if (inventory) {
        itemCount = await InventoryItem.count({
          where: { inventoryId: inventory.inventoryId }
        });
      }

      return {
        username: user.username,
        email: user.email,
        playername: user.playername || user.username,
        userImage: user.userImage,
        role: user.role,
        status: user.status,
        highScore: user.highScore,
        walletAddress: user.walletAddress,
        provider: user.provider,
        itemCount,
        joinDate: user.created_at
      };
    }));

    res.json({ 
      total: usersWithStats.length, 
      users: usersWithStats 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:username/inventory
 * Get specific user's inventory with item details and counts
 */
router.get('/users/:username/inventory', async (req, res) => {
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
      return res.status(200).json({
        username,
        totalItems: 0,
        inventory: []
      });
    }

    // Fetch all inventory items with item details
    const inventoryItems = await InventoryItem.findAll({
      where: { inventoryId: inventory.inventoryId },
      include: [{
        model: Item,
        attributes: ['itemId', 'name', 'imageUrl', 'rarity']
      }],
      order: [['obtainedAt', 'DESC']]
    });

    // Group items by itemId and count quantities
    const itemGroups = {};
    inventoryItems.forEach(ii => {
      if (ii.Item) {
        const itemId = ii.Item.itemId;
        if (!itemGroups[itemId]) {
          itemGroups[itemId] = {
            itemId: ii.Item.itemId,
            name: ii.Item.name,
            imageUrl: ii.Item.imageUrl,
            rarity: ii.Item.rarity,
            quantity: 0,
            items: []
          };
        }
        itemGroups[itemId].quantity++;
        itemGroups[itemId].items.push({
          inventoryItemId: ii.inventoryItemId,
          itemHash: ii.itemHash,
          obtainedAt: ii.obtainedAt,
          inMarket: ii.inMarket || false
        });
      }
    });

    const groupedInventory = Object.values(itemGroups);

    res.status(200).json({
      username,
      playername: user.playername || user.username,
      totalItems: inventoryItems.length,
      uniqueItems: groupedInventory.length,
      inventory: groupedInventory
    });
  } catch (error) {
    console.error('Error fetching user inventory:', error);
    res.status(500).json({ error: 'Failed to fetch user inventory' });
  }
});

/**
 * PUT /api/admin/users/:username/ban
 * Ban or unban a user
 */
router.put('/users/:username/ban', async (req, res) => {
  try {
    const { username } = req.params;
    const { ban } = req.body; // true to ban, false to unban

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow banning admins
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot ban admin users' });
    }

    const newStatus = ban ? 'banned' : 'active';
    await user.update({ status: newStatus });

    res.json({ 
      message: `User ${ban ? 'banned' : 'unbanned'} successfully`,
      username: user.username,
      status: user.status
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

export default router;
