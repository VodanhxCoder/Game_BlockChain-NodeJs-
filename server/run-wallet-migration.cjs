/**
 * Run migration to add walletAddress column to users table
 * This script runs the Sequelize migration programmatically
 */

const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function runMigration() {
  try {
    console.log('🔧 Running migration: add-wallet-address-to-users...\n');

    // Build Sequelize connection
    const db = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE;
    const user = process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER;
    const pass = process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
    const host = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
    const port = process.env.DB_PORT || process.env.MYSQL_PORT || 3306;
    const dialect = process.env.DB_DIALECT || 'mysql';

    if (!db || !user) {
      throw new Error('Database credentials not found. Check your .env file');
    }

    const sequelize = new Sequelize(db, user, pass, { 
      host, 
      port, 
      dialect, 
      logging: (msg) => console.log('  [SQL]', msg)
    });

    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    const queryInterface = sequelize.getQueryInterface();

    // Check if column already exists
    const tableDesc = await queryInterface.describeTable('users');
    
    if (tableDesc.walletAddress) {
      console.log('ℹ️  walletAddress column already exists');
      console.log('   Checking column properties...\n');
      
      console.log('   Current column definition:');
      console.log('   ├─ Type:', tableDesc.walletAddress.type);
      console.log('   ├─ Null:', tableDesc.walletAddress.allowNull ? 'YES' : 'NO');
      console.log('   ├─ Key:', tableDesc.walletAddress.unique ? 'UNI' : '');
      console.log('   └─ Default:', tableDesc.walletAddress.defaultValue || 'NULL');
      
      console.log('\n✅ Migration already applied');
      
    } else {
      console.log('⚠️  walletAddress column does NOT exist');
      console.log('   Adding column to users table...\n');
      
      await queryInterface.addColumn('users', 'walletAddress', {
        type: Sequelize.STRING(66),
        allowNull: true,
        unique: true,
        comment: 'User linked wallet address (hex)'
      });
      
      console.log('✅ walletAddress column added successfully!');
      console.log('   Type: VARCHAR(66)');
      console.log('   Null: YES');
      console.log('   Unique: YES\n');
    }

    // Show statistics
    const totalUsers = await sequelize.query(
      'SELECT COUNT(*) as total FROM users',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const linkedUsers = await sequelize.query(
      'SELECT COUNT(*) as linked FROM users WHERE walletAddress IS NOT NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log('📊 Database Statistics:');
    console.log(`   Total users: ${totalUsers[0].total}`);
    console.log(`   Linked wallets: ${linkedUsers[0].linked}`);
    console.log(`   Unlinked: ${totalUsers[0].total - linkedUsers[0].linked}\n`);

    await sequelize.close();
    
    console.log('✅ Migration completed successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Link wallets using: node manage-wallets.cjs link <username> <wallet>');
    console.log('   2. List all linked wallets: node manage-wallets.cjs list');
    console.log('   3. Verify specific user: node manage-wallets.cjs verify <username>\n');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration();
