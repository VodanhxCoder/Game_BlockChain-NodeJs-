const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Sequelize } = require('sequelize');

(async () => {
  try {
    // Build Sequelize connection from env
    const db = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE;
    const user = process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER;
    const pass = process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
    const host = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
    const port = process.env.DB_PORT || process.env.MYSQL_PORT || 3306;
    const dialect = process.env.DB_DIALECT || 'mysql';

    if (!db || !user) {
      throw new Error('DB connection info not found. Set DB_NAME/DB_USER/DB_PASS in .env');
    }

    const sequelize = new Sequelize(db, user, pass, { host, port, dialect, logging: console.log });

    await sequelize.authenticate();
    console.log('✅ DB connection OK');

    const queryInterface = sequelize.getQueryInterface();

    // Check if walletAddress column exists
    const tableDesc = await queryInterface.describeTable('users');
    
    if (tableDesc.walletAddress) {
      console.log('✅ walletAddress column already exists');
    } else {
      console.log('❌ walletAddress column does NOT exist - adding it now...');
      
      await queryInterface.addColumn('users', 'walletAddress', {
        type: Sequelize.STRING(66),
        allowNull: true,
        unique: true,
        comment: 'User linked wallet address (hex)'
      });
      
      console.log('✅ walletAddress column added successfully');
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
