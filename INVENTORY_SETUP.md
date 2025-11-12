# Inventory System Setup Guide

## Overview
Complete inventory system with database-driven item drops, drop pool configuration, and user inventory management.

## Features Implemented

### Backend
- **DropPool Model**: Stores items with configurable drop rates
- **Inventory Controller**: 
  - `GET /api/inventory/:username` - Fetch user's inventory
  - `POST /api/drop` - Simulate item drop (backend controls drop chance)
  - `GET /api/drop-pool` - View current drop configuration
- **Database Integration**: Items automatically added to user inventory on drop

### Frontend
- **GameCanvas**: Fetches drops from backend API on enemy kill
- **Inventory Page**: Displays user's collected items with:
  - Rarity-based color coding
  - Total items and estimated value
  - Item details (name, description, rarity, price)
  - Quantity tracking
- **Homepage HUD**: Shows last 5 recent drops in real-time

## Setup Instructions

### 1. Database Preparation
Ensure your database migrations are up to date:
```cmd
cd server
npx sequelize-cli db:migrate
```

### 2. Seed the Drop Pool
Run the seeder to populate items and drop rates:
```cmd
cd server
node src/scripts/seedDropPool.js
```

This creates 8 items with the following drop rates:
- **Common** (65%): Ion Fragment (35%), Scrap Metal (30%)
- **Uncommon** (28%): Plasma Charge (18%), Shield Booster (10%)
- **Rare** (6%): Stellar Prism (4.5%), Warp Core Fragment (1.5%)
- **Epic** (0.7%): Photon Shield
- **Legendary** (0.3%): Nebula Core

### 3. Start the Server
```cmd
cd server
npm start
```

### 4. Start the Client
```cmd
cd client
npm run dev
```

### 5. Test the System

1. **Login** to your account (required for inventory to work)

2. **Play the game** at `/H` (Homepage)
   - Destroy enemies to trigger drops
   - Watch the "Recent Drops" panel on the right
   - Drops are automatically saved to your inventory

3. **View inventory** at `/inventory`
   - See all collected items
   - View stats and rarity breakdown
   - Items are fetched from database

## API Endpoints

### Get User Inventory
```http
GET /api/inventory/:username
```
Response:
```json
{
  "username": "player1",
  "totalItems": 5,
  "inventory": [
    {
      "userItemId": 1,
      "quantity": 3,
      "acquiredDate": "2025-11-12T10:30:00Z",
      "item": {
        "itemId": 1,
        "name": "Ion Fragment",
        "rarity": "COMMON",
        "basePrice": "10.00"
      }
    }
  ]
}
```

### Simulate Drop
```http
POST /api/drop
Content-Type: application/json

{
  "username": "player1",
  "level": 3
}
```
Response:
```json
{
  "dropped": true,
  "item": {
    "itemId": 5,
    "name": "Stellar Prism",
    "rarity": "RARE",
    "basePrice": "150.00"
  },
  "userItemId": 42,
  "timestamp": "2025-11-12T10:35:00Z"
}
```

### Get Drop Pool
```http
GET /api/drop-pool
```
Response:
```json
{
  "totalEntries": 8,
  "dropPool": [
    {
      "dropId": 1,
      "itemId": 1,
      "dropRate": 35.00,
      "active": true,
      "item": {
        "name": "Ion Fragment",
        "rarity": "COMMON"
      }
    }
  ]
}
```

## Database Schema

### Items Table
```sql
CREATE TABLE items (
  item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  rarity ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY'),
  base_price DECIMAL(19,4),
  status VARCHAR(50) DEFAULT 'FOR_SALE',
  item_type VARCHAR(50) DEFAULT 'NORMAL',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Drop Pool Table
```sql
CREATE TABLE drop_pool (
  drop_id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  drop_rate DECIMAL(5,2) DEFAULT 1.0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(item_id)
);
```

### User Items Table
```sql
CREATE TABLE User_Items (
  user_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  item_id BIGINT NOT NULL,
  quantity INT DEFAULT 1,
  acquired_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(username),
  FOREIGN KEY (item_id) REFERENCES items(item_id)
);
```

## Customization

### Adjust Drop Rates
Edit `server/src/scripts/seedDropPool.js` and modify the `dropRate` values, then re-run the seeder.

### Add New Items
Add items to the `sampleItems` array in `seedDropPool.js`:
```javascript
{
  name: "New Item",
  description: "A new powerful item",
  rarity: "EPIC",
  basePrice: 750.00,
  itemType: "NFT",
  dropRate: 1.00 // 1% chance
}
```

### Modify Drop Logic
The drop logic is in `server/src/controllers/InventoryController.js` in the `simulateItemDrop` function.

## Troubleshooting

**No drops appearing:**
- Verify user is logged in (check `user?.username` in GameCanvas)
- Check browser console for API errors
- Verify drop pool has active entries: `GET /api/drop-pool`

**Inventory not loading:**
- Check if user is authenticated
- Verify database connection
- Check server logs for errors

**Items not persisting:**
- Verify User model username matches the one being sent
- Check User_Items table foreign key constraints
- Review server console for SQL errors

## Next Steps

- Add item trading system
- Implement NFT minting for rare items
- Add item usage/equipment system
- Create marketplace for item trading
- Add item crafting/combining mechanics
