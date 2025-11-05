// models/Transaction.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {

  class Transaction extends Model {}

  Transaction.init({
    transactionId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    buyerId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    sellerId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    itemId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['BUY_FROM_SHOP', 'P2P_TRADE', 'MINT']],
          msg: "Loại giao dịch không hợp lệ"
        }
      }
    },
    value: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      validate: {
        isDecimal: { msg: "Giá trị phải là số" },
        min: {
          args: [0],
          msg: "Giá trị giao dịch không được âm"
        }
      }
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Phải có đơn vị tiền tệ" }
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    timestamps: false
  });

  return Transaction;
};