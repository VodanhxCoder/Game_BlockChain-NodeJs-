import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class TradeLog extends Model {
    static associate(models) {
      // Trade involves an item
      TradeLog.belongsTo(models.InventoryItem, {
        foreignKey: "itemHash",
        as: "Item",
      });
      
      // Trade has a sender (from_user)
      TradeLog.belongsTo(models.User, {
        foreignKey: "fromUser",
        as: "FromUser",
      });
      
      // Trade has a receiver (to_user)
      TradeLog.belongsTo(models.User, {
        foreignKey: "toUser",
        as: "ToUser",
      });
      
      // Trade may be associated with a market listing
      TradeLog.belongsTo(models.MarketListing, {
        foreignKey: "listingId",
        as: "Listing",
      });
    }
  }

  TradeLog.init(
    {
      tradeId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "trade_id",
      },
      itemHash: {
        type: DataTypes.CHAR(64),
        allowNull: false,
        field: "item_hash",
        comment: "Primary item hash (seller's item in a trade)"
      },
      tradeItemHash: {
        type: DataTypes.CHAR(64),
        allowNull: true,
        field: "trade_item_hash",
        comment: "Secondary item hash (buyer's item offered in trade)"
      },
      fromUser: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "from_user",
      },
      toUser: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "to_user",
      },
      transactionHash: {
        type: DataTypes.STRING(66),
        allowNull: true,
        unique: true,
        field: "transaction_hash",
      },
      transactionType: {
        type: DataTypes.ENUM('MINT', 'TRADE', 'LIST', 'UNLIST', 'TRANSFER'),
        allowNull: false,
        defaultValue: 'TRADE',
        field: "transaction_type",
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'FAILED'),
        allowNull: false,
        defaultValue: 'CONFIRMED',
        field: "status",
      },
      blockNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "block_number",
      },
      gasUsed: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "gas_used",
      },
      gasFee: {
        type: DataTypes.STRING(78),
        allowNull: true,
        field: "gas_fee",
        comment: "Total gas fee paid (in wei)"
      },
      gasFeeEth: {
        type: DataTypes.DECIMAL(30, 18),
        allowNull: true,
        field: "gas_fee_eth",
        comment: "Total gas fee paid (in ETH)"
      },
      fromWallet: {
        type: DataTypes.STRING(42),
        allowNull: true,
        field: "from_wallet",
      },
      toWallet: {
        type: DataTypes.STRING(42),
        allowNull: true,
        field: "to_wallet",
      },
      listingId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "listing_id",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "error_message",
      },
      tradedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "traded_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "updated_at",
      },
    },
    {
      sequelize,
      modelName: "TradeLog",
      tableName: "trade_log",
      timestamps: false, // Using custom timestamp fields
      underscored: false, // Using custom field mapping
    }
  );

  return TradeLog;
};