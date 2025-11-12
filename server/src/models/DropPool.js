// models/DropPool.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class DropPool extends Model {}

  DropPool.init({
    dropId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'drop_id'
    },
    itemId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'item_id'
    },
    dropRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 1.0,
      field: 'drop_rate',
      validate: {
        min: 0,
        max: 100
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'DropPool',
    tableName: 'drop_pool',
    timestamps: false
  });

  return DropPool;
};
