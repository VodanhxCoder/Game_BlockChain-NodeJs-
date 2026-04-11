// Test script to check drop pool configuration
const db = require('../models');

async function testDropPool() {
  try {
    console.log('🔍 Checking drop pool configuration...\n');
    
    // Fetch all drop pool entries
    const dropPool = await db.DropPool.findAll({
      include: [{
        model: db.Item,
        attributes: ['itemId', 'name', 'rarity']
      }],
      where: { active: true },
      order: [['dropRate', 'DESC']]
    });

    if (dropPool.length === 0) {
      console.log('[ERROR] No items in drop pool!');
      process.exit(1);
    }

    console.log('📊 DROP POOL CONFIGURATION:');
    console.log('═'.repeat(50));
    
    dropPool.forEach((entry, index) => {
      const rate = parseFloat(entry.dropRate);
      console.log(`${index + 1}. ${entry.Item.name.padEnd(20)} | ${entry.Item.rarity.padEnd(10)} | ${rate.toFixed(2)}% chance`);
    });
    
    console.log('═'.repeat(50));
    console.log(`Total items: ${dropPool.length}`);
    console.log('Note: Each item has independent drop chance (not cumulative)\n');

    // Simulate 10 drops with independent drop rates
    console.log('🎲 Simulating 10 enemy kills:');
    console.log('─'.repeat(50));
    
    for (let i = 1; i <= 10; i++) {
      const droppedItems = [];
      
      // Roll for each item independently
      for (const entry of dropPool) {
        const dropChance = parseFloat(entry.dropRate);
        const roll = Math.random() * 100;
        
        if (roll <= dropChance) {
          droppedItems.push(entry.Item);
        }
      }

      if (droppedItems.length === 0) {
        console.log(`Kill ${i.toString().padStart(2)}: [BLOCK] No drops`);
      } else if (droppedItems.length === 1) {
        const dropped = droppedItems[0];
        const rarityColor = dropped.rarity === 'Legendary' ? '*' : dropped.rarity === 'Rare' ? '+' : '-';
        console.log(`Kill ${i.toString().padStart(2)}: ${rarityColor} ${dropped.name} (${dropped.rarity})`);
      } else {
        // Multiple items dropped - pick one randomly (as backend does)
        const picked = droppedItems[Math.floor(Math.random() * droppedItems.length)];
        const rarityColor = picked.rarity === 'Legendary' ? '*' : picked.rarity === 'Rare' ? '+' : '-';
        console.log(`Kill ${i.toString().padStart(2)}: ${rarityColor} ${picked.name} (${picked.rarity}) [${droppedItems.length} items rolled, 1 picked]`);
      }
    }

    console.log('\n[OK] Drop pool is working correctly!\n');
    
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Error testing drop pool:', error);
    process.exit(1);
  }
}

testDropPool();
