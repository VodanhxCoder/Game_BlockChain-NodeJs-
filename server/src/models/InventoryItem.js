// models/InventoryItem.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class InventoryItem extends Model {}

  InventoryItem.init({
    inventoryItemId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'inventory_item_id'
    },
    inventoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'inventory_id'
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'item_id'
    },
    owner: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    obtainedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'obtained_at'
    },
    itemHash: {
      type: DataTypes.CHAR(64),
      unique: true,
      field: 'item_hash'
    }
  }, {
    sequelize,
    modelName: 'InventoryItem',
    tableName: 'inventory_items',
    timestamps: false
  });

  return InventoryItem;
};
