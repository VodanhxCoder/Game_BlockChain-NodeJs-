// scripts/seedDropPool.js
// Populates the drop pool and items tables with sample game items
const db = require("../models");
const Item = db.Item;
const DropPool = db.DropPool;

const sampleItems = [
  // COMMON items (higher drop rates)
  // Note: Each item has independent drop chance (not cumulative)
  {
    name: "Ion Fragment",
    imageUrl: "ion-fragment.png",
    rarity: "Common",
    dropRate: 25.00 // 25% independent chance per kill
  },
  {
    name: "Scrap Metal",
    imageUrl: "scrap-metal.png",
    rarity: "Common",
    dropRate: 20.00 // 20% chance
  },
  {
    name: "Energy Cell",
    imageUrl: "energy-cell.png",
    rarity: "Common",
    dropRate: 15.00 // 15% chance
  },
  {
    name: "Space Debris",
    imageUrl: "space-debris.png",
    rarity: "Common",
    dropRate: 10.00 // 10% chance
  },
  // RARE items - 25% total
  {
    name: "Plasma Charge",
    imageUrl: "plasma-charge.png",
    rarity: "Rare",
    dropRate: 10.00 // 10% chance
  },
  {
    name: "Shield Booster",
    imageUrl: "shield-booster.png",
    rarity: "Rare",
    dropRate: 8.00 // 8% chance
  },
  {
    name: "Warp Core",
    imageUrl: "warp-core.png",
    rarity: "Rare",
    dropRate: 5.00 // 5% chance
  },
  {
    name: "Quantum Battery",
    imageUrl: "quantum-battery.png",
    rarity: "Rare",
    dropRate: 2.00 // 2% chance
  },
  // LEGENDARY items - 5% total
  {
    name: "Nebula Core",
    imageUrl: "nebula-core.png",
    rarity: "Legendary",
    dropRate: 2.50 // 2.5% chance
  },
  {
    name: "Photon Shield",
    imageUrl: "photon-shield.png",
    rarity: "Legendary",
    dropRate: 1.50 // 1.5% chance
  },
  {
    name: "Cosmic Crystal",
    imageUrl: "cosmic-crystal.png",
    rarity: "Legendary",
    dropRate: 1.00 // 1% chance
  }
];

async function seedDropPool() {
  try {
    console.log('🌱 Starting drop pool seeding...\n');

    // Clear existing drop pool and items
    console.log('🗑️  Clearing existing data...');
    await DropPool.destroy({ where: {}, truncate: true });
    console.log('   ✅ Cleared drop_pool table');
    
    await Item.destroy({ where: {}, truncate: true });
    console.log('   ✅ Cleared items table\n');

    let createdCount = 0;
    let totalDropRate = 0;

    console.log('📦 Creating items and drop pool entries...\n');

    for (const itemData of sampleItems) {
      const { dropRate, ...itemAttributes } = itemData;

      // Create the item
      const item = await Item.create(itemAttributes);
      console.log(`   ✅ Created: ${item.name.padEnd(20)} (${item.rarity.padEnd(10)}) - ID: ${item.itemId}`);

      // Add to drop pool
      await DropPool.create({
        itemId: item.itemId,
        dropRate: dropRate,
        active: true
      });
      
      console.log(`      💎 Drop rate: ${dropRate.toFixed(2)}%\n`);
      createdCount++;
      totalDropRate += dropRate;
    }

    // Verify total drop rate
    const allEntries = await DropPool.findAll({ where: { active: true } });
    const totalRate = allEntries.reduce((sum, entry) => sum + parseFloat(entry.dropRate), 0);
    
    console.log('\n📊 Drop Pool Summary:');
    console.log('═'.repeat(60));
    console.log('📊 Drop Pool Summary:');
    console.log(`   Total items: ${createdCount}`);
    console.log(`   Total drop rate: ${totalDropRate.toFixed(2)}%`);
    
    if (Math.abs(totalDropRate - 100) < 0.01) {
      console.log('   ✅ Drop rates sum to 100%');
    } else {
      console.log(`   ⚠️  Warning: Drop rates sum to ${totalDropRate.toFixed(2)}% (should be 100%)`);
    }
    console.log('═'.repeat(60));
    console.log('\n✨ Drop pool seeding completed successfully!\n');

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding drop pool:', error);
    await db.sequelize.close();
    process.exit(1);
  }
}

// Run the seeder
seedDropPool();
