// Verify the market_listings table structure
const { Sequelize } = require('sequelize');
const config = require('./src/config/config.cjs');

async function verifyTable() {
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];

  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: false
    }
  );

  try {
    await sequelize.authenticate();
    
    const [results] = await sequelize.query(
      "DESCRIBE market_listings"
    );
    
    console.log('\n📋 market_listings table structure:\n');
    console.table(results);
    
  } catch (error) {
    console.error('[ERROR] Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifyTable();
