// models/Inventory.js
import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Inventory extends Model {}

  Inventory.init({
    inventoryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'inventory_id'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'Inventory',
    tableName: 'inventories',
    timestamps: false
  });

  return Inventory;
};
