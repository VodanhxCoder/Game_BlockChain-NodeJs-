// models/index.js
import { Sequelize } from 'sequelize';

// `src/config/sequelize.js` may export the Sequelize instance directly or an object
// { sequelize, testConnection }. Accept both shapes.
import { sequelize } from '../config/sequelize.js';

// 2. Nạp các file model
import setupUserModel from './User.js';
import setupItemModel from './Item.js';


import setupDropPoolModel from './DropPool.js';
import setupInventoryModel from './Inventory.js';
import setupInventoryItemModel from './InventoryItem.js';
import setupMarketListingModel from './MarketListing.js';
import setupTradeLogModel from './TradeLog.js';

// 3. Khởi tạo các models
const User = setupUserModel(sequelize);
const Item = setupItemModel(sequelize);
const DropPool = setupDropPoolModel(sequelize);
const Inventory = setupInventoryModel(sequelize);
const InventoryItem = setupInventoryItemModel(sequelize);
const MarketListing = setupMarketListingModel(sequelize);
const TradeLog = setupTradeLogModel(sequelize);

// 4. Định nghĩa các mối quan hệ (Associations)
// Mối quan hệ 1-1: Item và NFT


// Mối quan hệ 1-N: User và UserItem (1 User có nhiều UserItem)


// Mối quan hệ 1-N: Item và UserItem (1 Item có thể nằm trong nhiều túi đồ)


// Mối quan hệ 1-N: Item và DropPool (1 Item có thể có nhiều drop pool entries)
Item.hasMany(DropPool, { foreignKey: 'itemId', onDelete: 'CASCADE' });
DropPool.belongsTo(Item, { foreignKey: 'itemId' });

// Mối quan hệ 1-1: User và Inventory (1 User có 1 Inventory)
User.hasOne(Inventory, { foreignKey: 'username', sourceKey: 'username', onDelete: 'CASCADE' });
Inventory.belongsTo(User, { foreignKey: 'username', targetKey: 'username' });

// Mối quan hệ 1-N: Inventory và InventoryItem (1 Inventory có nhiều InventoryItem)
Inventory.hasMany(InventoryItem, { foreignKey: 'inventoryId', onDelete: 'CASCADE' });
InventoryItem.belongsTo(Inventory, { foreignKey: 'inventoryId' });

// Mối quan hệ 1-N: Item và InventoryItem (1 Item có thể nằm trong nhiều inventories)
Item.hasMany(InventoryItem, { foreignKey: 'itemId', onDelete: 'CASCADE' });
InventoryItem.belongsTo(Item, { foreignKey: 'itemId' });

// Mối quan hệ 1-N: Item và MarketListing (wanted item id relationship)
// A listing may express a desired item by id (wanted_item_id -> items.item_id)
Item.hasMany(MarketListing, { foreignKey: 'wantedItemId', sourceKey: 'itemId' });
MarketListing.belongsTo(Item, { foreignKey: 'wantedItemId', targetKey: 'itemId', as: 'WantedItem' });

// Mối quan hệ 1-N: User và InventoryItem (owner relationship)
User.hasMany(InventoryItem, { foreignKey: 'owner', sourceKey: 'username', onDelete: 'CASCADE' });
InventoryItem.belongsTo(User, { foreignKey: 'owner', targetKey: 'username', as: 'Owner' });

// Mối quan hệ 1-N: User và MarketListing (seller relationship)
User.hasMany(MarketListing, { foreignKey: 'seller', sourceKey: 'username', onDelete: 'CASCADE' });
MarketListing.belongsTo(User, { foreignKey: 'seller', targetKey: 'username', as: 'Seller' });

// Mối quan hệ 1-1: InventoryItem và MarketListing (item can only be listed once)
InventoryItem.hasOne(MarketListing, { foreignKey: 'itemHash', sourceKey: 'itemHash', onDelete: 'CASCADE' });
MarketListing.belongsTo(InventoryItem, { foreignKey: 'itemHash', targetKey: 'itemHash' });

// Mối quan hệ 1-N: Transactions



// 5. Xuất các models và sequelize instance
const db = {
  sequelize,
  User,
  Item,
  DropPool,
  Inventory,
  InventoryItem,
  MarketListing,
  TradeLog
};

export default db;