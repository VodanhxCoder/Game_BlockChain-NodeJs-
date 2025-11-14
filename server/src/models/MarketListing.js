// models/MarketListing.js
import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class MarketListing extends Model {}

  MarketListing.init({
    listingId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'listing_id'
    },
    itemHash: {
      type: DataTypes.CHAR(64),
      allowNull: false,
      field: 'item_hash'
    },
    // id of the item the seller wants in exchange (optional). References items.item_id
    wantedItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'wanted_item_id'
    },
    seller: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    tier: {
      type: DataTypes.ENUM('Common', 'Rare', 'Legendary'),
      allowNull: false,
      defaultValue: 'Common'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'MarketListing',
    tableName: 'market_listings',
    timestamps: false
  });

  return MarketListing;
};
