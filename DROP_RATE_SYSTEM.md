# Drop Rate System Documentation

## Overview
The game uses an **independent drop rate system** where each item in the drop pool has its own separate percentage chance to drop.

## How It Works

### Independent Drop Rates
- Each item in `drop_pool` table has a `drop_rate` field (e.g., 9.09)
- This represents the **independent percentage chance** for that specific item to drop
- When an enemy is killed, the system rolls for **each item separately**
- Drop rates do **NOT** need to sum to 100%

### Drop Algorithm
1. Player kills an enemy
2. Frontend calls `POST /api/drop` with username and level
3. Backend fetches all active items from `drop_pool`
4. For each item:
   - Roll a random number between 0-100
   - If roll ≤ item's `drop_rate`, add item to potential drops
5. If **no items** rolled successfully → return `{ dropped: false }`
6. If **one item** rolled successfully → drop that item
7. If **multiple items** rolled successfully → pick one randomly

### Example
With current setup (11 items @ 9.09% each):
```
Kill 1: Roll for all 11 items independently
  - Iron Sword: roll 15.2 > 9.09 ❌
  - Magic Wand: roll 5.3 ≤ 9.09 ✅
  - Dragon Shield: roll 92.1 > 9.09 ❌
  - ... (other items)
  
Result: Magic Wand drops (only 1 item rolled successfully)

Kill 2: Roll again
  - Iron Sword: roll 7.1 ≤ 9.09 ✅
  - Magic Wand: roll 3.2 ≤ 9.09 ✅
  - Dragon Shield: roll 88.5 > 9.09 ❌
  - ... (other items)
  
Result: 2 items rolled → pick one randomly (e.g., Iron Sword)

Kill 3: Roll again
  - All items roll > 9.09 ❌
  
Result: No drop
```

## Drop Rate Configuration

### Current Configuration
All 11 items have 9.09% independent drop chance:
- **Common items** (4): Iron Sword, Ion Fragment, Scrap Metal, Energy Cell
- **Rare items** (4): Magic Wand, Plasma Charge, Shield Booster, Warp Core
- **Legendary items** (3): Dragon Shield, Nebula Core, Photon Shield

### Customizing Drop Rates
You can set different drop rates per item in the database:

```sql
-- Example: Make legendary items rarer
UPDATE drop_pool SET drop_rate = 2.0 WHERE item_id IN (3, 10, 11); -- Legendary: 2%
UPDATE drop_pool SET drop_rate = 5.0 WHERE item_id IN (2, 7, 8, 9); -- Rare: 5%
UPDATE drop_pool SET drop_rate = 15.0 WHERE item_id IN (1, 4, 5, 6); -- Common: 15%
```

### Expected Drop Frequency
With 9.09% independent drop rate per item:
- **Average drops per kill**: ~0.9-1.0 items (since 11 × 9.09% ≈ 100%)
- **No drop probability**: ~33% chance per kill
- **Multiple items rolled**: ~20-30% chance (one picked randomly)

## Testing
Run the test script to simulate drops:
```bash
cd server
node src/scripts/testDropPool.js
```

This will:
1. Show all items and their drop rates
2. Simulate 10 enemy kills
3. Display which items dropped (or "No drops")

## Database Schema
```sql
CREATE TABLE drop_pool (
  drop_id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  drop_rate DECIMAL(5,2) DEFAULT 1.0,  -- Independent drop chance (0-100)
  active BOOLEAN DEFAULT true,
  created_at DATETIME,
  FOREIGN KEY (item_id) REFERENCES items(item_id)
);
```

## Advantages of Independent System
1. **Flexible**: Can set any drop rate without affecting other items
2. **Realistic**: Mimics real-world loot systems (e.g., boss drops)
3. **Tunable**: Easy to adjust individual item rarity
4. **Scalable**: Adding new items doesn't require rebalancing

## Notes
- Drop rates can exceed 100% total (each item is independent)
- Setting all items to 50% means ~50% of kills drop nothing, ~50% drop 1+ items
- Frontend handles falling item physics and collection
- Backend handles inventory persistence (adds to `User_Items` table)
