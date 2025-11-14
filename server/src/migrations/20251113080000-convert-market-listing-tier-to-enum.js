"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // This migration safely converts an INTEGER `tier` column (0/1/2)
    // into an ENUM('Common','Rare','Legendary') while preserving data.
    // Steps:
    // 1. Add a new enum column `tier_new` with desired values.
    // 2. Copy values from `tier` -> `tier_new` using CASE mapping.
    // 3. Drop old `tier` column.
    // 4. Rename `tier_new` -> `tier` and recreate index.

    // Add enum column
    await queryInterface.addColumn('market_listings', 'tier_new', {
      type: Sequelize.ENUM('Common', 'Rare', 'Legendary'),
      allowNull: false,
      defaultValue: 'Common'
    });

    // Map integer values to enum strings; tolerate NULL/unknown values by defaulting to 'Common'
    const mapSql = `
      UPDATE market_listings SET tier_new =
        CASE
          WHEN tier = 0 THEN 'Common'
          WHEN tier = 1 THEN 'Rare'
          WHEN tier = 2 THEN 'Legendary'
          WHEN tier IN ('Common','Rare','Legendary') THEN tier -- already string (safe no-op)
          ELSE 'Common'
        END
    `;
    await queryInterface.sequelize.query(mapSql);

    // Remove possible old integer column. Use a safe check: attempt to drop column if exists.
    try {
      await queryInterface.removeColumn('market_listings', 'tier');
    } catch (err) {
      // If removal fails because column doesn't exist or type already enum, ignore.
      // console.warn('Could not remove old tier column (it may not exist yet).', err.message);
    }

    // Rename tier_new -> tier. Sequelize does not expose a renameColumn that keeps enum metadata reliably
    // across dialects, but queryInterface.renameColumn should be fine for MySQL/Postgres.
    await queryInterface.renameColumn('market_listings', 'tier_new', 'tier');

    // Recreate index on tier (some DBs will keep it but ensure it's present)
    await queryInterface.addIndex('market_listings', ['tier']);
  },

  async down(queryInterface, Sequelize) {
    // Reverse: create integer column tier_old, copy values back (Common->0, Rare->1, Legendary->2),
    // drop enum column and rename back.
    await queryInterface.addColumn('market_listings', 'tier_old', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    const mapBackSql = `
      UPDATE market_listings SET tier_old =
        CASE
          WHEN tier = 'Common' THEN 0
          WHEN tier = 'Rare' THEN 1
          WHEN tier = 'Legendary' THEN 2
          WHEN tier IN (0,1,2) THEN tier
          ELSE 0
        END
    `;
    await queryInterface.sequelize.query(mapBackSql);

    // Drop enum column
    try {
      await queryInterface.removeColumn('market_listings', 'tier');
    } catch (err) {
      // ignore
    }

    // Rename tier_old -> tier
    await queryInterface.renameColumn('market_listings', 'tier_old', 'tier');

    // Remove enum type from DB if dialect requires manual cleanup (best-effort)
    // Note: Some dialects (like Postgres) create a type for ENUM that may need manual DROP TYPE.
    // We intentionally do not attempt to drop DB-level enum types here to avoid accidental data loss.
  }
};
