// models/BlockchainTransaction.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class BlockchainTransaction extends Model {}

  BlockchainTransaction.init({
    txId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'tx_id'
    },
    transactionHash: {
      type: DataTypes.STRING(66),
      allowNull: false,
      unique: true,
      field: 'transaction_hash'
    },
    transactionType: {
      type: DataTypes.ENUM('MINT', 'TRADE', 'LIST', 'UNLIST'),
      allowNull: false,
      field: 'transaction_type'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'block_number'
    },
    gasUsed: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'gas_used'
    },
    listingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'listing_id'
    },
    itemHash: {
      type: DataTypes.CHAR(64),
      allowNull: true,
      field: 'item_hash'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'BlockchainTransaction',
    tableName: 'blockchain_transactions',
    timestamps: true
  });

  return BlockchainTransaction;
};
