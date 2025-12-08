// Run a single migration file
const { Sequelize } = require('sequelize');
const path = require('path');

async function runMigration() {
  // Load config
  const config = require('./src/config/config.cjs');
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];

  // Create Sequelize instance
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: console.log
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Load and run the specific migration
    const migrationFile = require('./src/migrations/20251123000001-add-seller-signature-timestamp.cjs');
    
    const queryInterface = sequelize.getQueryInterface();
    
    console.log('🔄 Running migration: add-seller-signature-timestamp');
    await migrationFile.up(queryInterface, Sequelize);
    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
