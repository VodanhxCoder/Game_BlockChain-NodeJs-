// Script to clear drop pool table
const db = require('../models');

async function clearDropPool() {
  try {
    console.log('🗑️  Clearing drop pool table...\n');
    
    // Delete all entries from drop_pool
    const deleted = await db.DropPool.destroy({
      where: {},
      truncate: true
    });

    console.log(`[OK] Removed ${deleted} entries from drop_pool table`);
    console.log(' Drop pool is now empty\n');
    
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Error clearing drop pool:', error);
    process.exit(1);
  }
}

clearDropPool();
