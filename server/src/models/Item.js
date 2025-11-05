// models/Item.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {

  class Item extends Model {}

  Item.init({
    // --- THUỘC TÍNH ---
    itemId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Tên vật phẩm không được để trống." },
        len: {
          args: [3, 255],
          msg: "Tên vật phẩm phải từ 3 đến 255 ký tự."
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: { msg: "URL hình ảnh không hợp lệ." }
      }
    },
    rarity: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['COMMON', 'RARE', 'EPIC', 'LEGENDARY']],
          msg: "Độ hiếm không hợp lệ (phải là COMMON, RARE, EPIC, hoặc LEGENDARY)."
        }
      }
    },
    basePrice: {
      type: DataTypes.DECIMAL(19, 4), 
      allowNull: false,
      validate: {
        isDecimal: { msg: "Giá phải là một con số." },
        min: {
          args: [0],
          msg: "Giá không được là số âm."
        }
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'FOR_SALE',
      validate: {
        isIn: {
          args: [['FOR_SALE', 'HIDDEN', 'MINTED']],
          msg: "Trạng thái không hợp lệ (phải là FOR_SALE, HIDDEN, hoặc MINTED)."
        }
      }
    },
    itemType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['NORMAL', 'NFT']],
          msg: "Loại vật phẩm không hợp lệ (phải là NORMAL hoặc NFT)."
        }
      }
    }
  }, {
    // --- TÙY CHỌN ---
    sequelize,
    modelName: 'Item',
    timestamps: true // Tự động quản lý createdAt và updatedAt
  });

  return Item;
};