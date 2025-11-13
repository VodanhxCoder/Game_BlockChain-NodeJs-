"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert listings for any inventory_items flagged as in_market = true.
    // We map item rarity to a numeric tier: Common=0, Rare=1, Legendary=2.
    // Skip items already listed (by item_hash) to make this idempotent.
    const insertSql = `
      INSERT INTO market_listings (item_hash, wanted_item_id, seller, tier, created_at)
      SELECT ii.item_hash,
             NULL as wanted_item_id,
             ii.owner as seller,
             CASE it.item_tier
               WHEN 'Common' THEN 0
               WHEN 'Rare' THEN 1
               WHEN 'Legendary' THEN 2
               ELSE 0
             END as tier,
             ii.obtained_at
      FROM inventory_items ii
      JOIN items it ON ii.item_id = it.item_id
      WHERE ii.in_market = 1
        AND ii.item_hash IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM market_listings ml WHERE ml.item_hash = ii.item_hash
        )
    `;

    await queryInterface.sequelize.query(insertSql);
  },

  async down(queryInterface, Sequelize) {
    // Remove any market_listings that correspond to inventory_items that were in_market
    const deleteSql = `
      DELETE ml FROM market_listings ml
      JOIN inventory_items ii ON ml.item_hash = ii.item_hash
      WHERE ii.in_market = 1
    `;

    await queryInterface.sequelize.query(deleteSql);
  },
};
