// Script to populate drop_pool table with entries for existing items
const db = require('../models');

async function populateDropPool() {
  try {
    console.log('🎲 Populating drop pool from existing items...\n');
    
    // Get all items from the items table
    const items = await db.Item.findAll({
      order: [['itemId', 'ASC']]
    });

    if (items.length === 0) {
      console.log('[ERROR] No items found in items table!');
      console.log('Please add items to the items table first.\n');
      process.exit(1);
    }

    console.log(`📦 Found ${items.length} items in items table`);
    console.log(`🎯 Adding all ${items.length} items to drop pool:`);
    items.forEach(item => {
      console.log(`   ${item.itemId}. ${item.name} (${item.rarity})`);
    });
    console.log('');

    // Get existing drop pool entries (if any) to preserve custom drop rates
    const existingDropPool = await db.DropPool.findAll();
    const existingRatesMap = {};
    existingDropPool.forEach(entry => {
      existingRatesMap[entry.itemId] = parseFloat(entry.dropRate);
    });

    console.log(`📋 Found ${existingDropPool.length} existing drop pool entries\n`);

    // Clear existing drop pool entries
    await db.DropPool.destroy({ where: {}, truncate: true });
    console.log('🗑️  Cleared existing drop_pool entries\n');

    // Default drop rates based on item rarity (used if no existing rate found)
    // Common: 15%, Rare: 10%, Legendary: 5%
    const rarityDropRates = {
      'Common': 15.00,
      'Rare': 10.00,
      'Legendary': 5.00
    };

    // Create drop pool entries for each item
    // Use existing drop rate from drop_pool table if available, otherwise use rarity-based default
    let totalRate = 0;
    const dropPoolEntries = [];

    for (const item of items) {
      // Check if this item had a drop rate in the old drop_pool
      const existingRate = existingRatesMap[item.itemId];
      const rate = existingRate || rarityDropRates[item.rarity] || 5.00;
      
      const entry = await db.DropPool.create({
        itemId: item.itemId,
        dropRate: rate,
        active: true
      });

      dropPoolEntries.push(entry);
      totalRate += rate;
      
      const source = existingRate ? 'from existing drop_pool' : `based on ${item.rarity} rarity`;
      console.log(`[OK] Added ${item.name} (${item.rarity}) with ${rate.toFixed(2)}% drop chance (${source})`);
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`📊 DROP POOL SUMMARY:`);
    console.log(`   Total items: ${dropPoolEntries.length}`);
    console.log(`   Note: Each item has INDEPENDENT drop chance`);
    console.log(`   (Multiple items can drop from same enemy)`);
    console.log('═'.repeat(50));
    console.log('\n Drop pool populated successfully!\n');

    // Show final drop pool
    console.log('📋 Current drop pool:');
    const pool = await db.DropPool.findAll({
      include: [{
        model: db.Item,
        attributes: ['itemId', 'name', 'rarity']
      }],
      order: [['dropRate', 'DESC']]
    });

    pool.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.Item.name.padEnd(20)} | ${entry.Item.rarity.padEnd(10)} | ${parseFloat(entry.dropRate).toFixed(2)}%`);
    });
    console.log('');

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Error populating drop pool:', error);
    process.exit(1);
  }
}

populateDropPool();
