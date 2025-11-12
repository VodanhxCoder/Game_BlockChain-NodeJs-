// models/Item.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {

  class Item extends Model {}

  Item.init({
    // --- THUỘC TÍNH ---
    itemId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'item_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'item_name',
      validate: {
        notEmpty: { msg: "Tên vật phẩm không được để trống." },
        len: {
          args: [3, 100],
          msg: "Tên vật phẩm phải từ 3 đến 100 ký tự."
        }
      }
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'item_image'
    },
    rarity: {
      type: DataTypes.ENUM('Common', 'Rare', 'Legendary'),
      allowNull: false,
      defaultValue: 'Common',
      field: 'item_tier',
      validate: {
        isIn: {
          args: [['Common', 'Rare', 'Legendary']],
          msg: "Độ hiếm không hợp lệ (phải là Common, Rare, hoặc Legendary)."
        }
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    // --- TÙY CHỌN ---
    sequelize,
    modelName: 'Item',
    tableName: 'items',
    timestamps: false
  });

  return Item;
};