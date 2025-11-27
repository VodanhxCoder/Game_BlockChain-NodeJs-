require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log
  }
);

async function runSingleMigration() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    console.log('🔄 Adding seller_signature_timestamp column...');
    await sequelize.query(`
      ALTER TABLE market_listings 
      ADD COLUMN seller_signature_timestamp BIGINT NULL 
      COMMENT 'Timestamp when seller signature was created (milliseconds)'
    `);
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runSingleMigration();
