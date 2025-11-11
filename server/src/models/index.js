// models/index.js
const { Sequelize } = require('sequelize');

// `src/config/sequelize.js` may export the Sequelize instance directly or an object
// { sequelize, testConnection }. Accept both shapes.
const sequelizeModule = require('../config/sequelize');
const sequelize = sequelizeModule && sequelizeModule.sequelize ? sequelizeModule.sequelize : sequelizeModule;

// 2. Nạp các file model
const setupUserModel = require('./User');
const setupItemModel = require('./Item');
const setupNFTModel = require('./NFT');
const setupUserItemModel = require('./UserItem');
const setupTransactionModel = require('./Transaction');

// 3. Khởi tạo các models
const User = setupUserModel(sequelize);
const Item = setupItemModel(sequelize);
const NFT = setupNFTModel(sequelize);
const UserItem = setupUserItemModel(sequelize);
const Transaction = setupTransactionModel(sequelize);

// 4. Định nghĩa các mối quan hệ (Associations)
// Mối quan hệ 1-1: Item và NFT
Item.hasOne(NFT, { foreignKey: 'itemId', onDelete: 'CASCADE' });
NFT.belongsTo(Item, { foreignKey: 'itemId' });

// Mối quan hệ 1-N: User và UserItem (1 User có nhiều UserItem)
User.hasMany(UserItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserItem.belongsTo(User, { foreignKey: 'userId' });

// Mối quan hệ 1-N: Item và UserItem (1 Item có thể nằm trong nhiều túi đồ)
Item.hasMany(UserItem, { foreignKey: 'itemId', onDelete: 'CASCADE' });
UserItem.belongsTo(Item, { foreignKey: 'itemId' });

// Mối quan hệ 1-N: Transactions
User.hasMany(Transaction, { as: 'Purchases', foreignKey: 'buyerId' });
User.hasMany(Transaction, { as: 'Sales', foreignKey: 'sellerId' });
Item.hasMany(Transaction, { foreignKey: 'itemId' });

Transaction.belongsTo(User, { as: 'Buyer', foreignKey: 'buyerId' });
Transaction.belongsTo(User, { as: 'Seller', foreignKey: 'sellerId' });
Transaction.belongsTo(Item, { foreignKey: 'itemId' });

// 5. Xuất các models và sequelize instance
module.exports = {
  sequelize,
  User,
  Item,
  NFT,
  UserItem,
  Transaction
};