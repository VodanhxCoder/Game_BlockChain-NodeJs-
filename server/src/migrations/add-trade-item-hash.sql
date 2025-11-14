-- Add trade_item_hash column to trade_log table
-- This stores the buyer's item hash in a trade (the item being offered in exchange)

ALTER TABLE `trade_log` 
ADD COLUMN `trade_item_hash` CHAR(64) NULL 
COMMENT 'Secondary item hash (buyer\'s item offered in trade)' 
AFTER `item_hash`;

-- Update existing records to set trade_item_hash to NULL (already done by default)
-- No action needed for existing records
