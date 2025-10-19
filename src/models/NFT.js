const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {

  class NFT extends Model {}

  NFT.init({
    // --- THUỘC TÍNH ---
    itemId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false 
    },
    contractAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Địa chỉ contract không được trống." },
        is: {
          args: [/^0x[a-fA-F0-9]{40}$/],
          msg: "Địa chỉ contract không hợp lệ."
        }
      }
    },
    tokenId: {
      type: DataTypes.BIGINT, 
      allowNull: false,
      validate: {
        isNumeric: { msg: "Token ID phải là số." }
      }
    },
    transactionHash: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: {
          args: [/^0x[a-fA-F0-9]{64}$/],
          msg: "Mã giao dịch (TxHash) không hợp lệ."
        }
      }
    },
    mintTimestamp: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    // --- TÙY CHỌN ---
    sequelize,
    modelName: 'NFT',
    timestamps: false 
  });

  return NFT;
};