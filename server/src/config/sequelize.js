// src/config/sequelize.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
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

if (require.main === module) {
  testConnection();
}

module.exports = {
  sequelize: sequelize,
  testConnection: testConnection
};