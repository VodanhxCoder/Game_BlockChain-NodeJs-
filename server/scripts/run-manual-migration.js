// Run database migrations manually
// Usage: node src/migrations/run-migration.js add-oauth-columns.sql

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get migration file from command line args
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node run-migration.js <migration-file.sql>');
  process.exit(1);
}

const migrationPath = path.join(__dirname, migrationFile);

// Check if migration file exists
if (!fs.existsSync(migrationPath)) {
  console.error(`Migration file not found: ${migrationPath}`);
  process.exit(1);
}

// Read migration SQL
const sql = fs.readFileSync(migrationPath, 'utf-8');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'game_blockchain',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: console.log,
  }
);

async function runMigration() {
  try {
    console.log(`Running migration: ${migrationFile}`);
    
    // Split by semicolon and filter out comments and empty lines
    const statements = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--');
      })
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Executing:`);
      console.log(statement.substring(0, 150) + (statement.length > 150 ? '...' : ''));
      
      try {
        await sequelize.query(statement);
        console.log('✓ Success');
      } catch (error) {
        // Skip errors for already existing columns/indexes
        if (error.message.includes('Duplicate column') || 
            error.message.includes('Duplicate key') ||
            error.message.includes('already exists')) {
          console.log('[WARN] Already exists, skipping');
        } else {
          throw error;
        }
      }
    }

    console.log('\n✓ Migration completed successfully');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
