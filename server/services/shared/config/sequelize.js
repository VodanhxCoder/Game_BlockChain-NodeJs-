// src/config/sequelize.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false
});


const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối CSDL thành công.');
  } catch (error) {
    console.error('Không thể kết nối đến CSDL:', error);
  }
};

export { sequelize, testConnection };

// Run test connection if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnection();
}
;