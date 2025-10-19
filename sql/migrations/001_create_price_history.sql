-- Create price_history table for storing daily price snapshots
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_type VARCHAR(10) NOT NULL CHECK (metal_type IN ('gold', 'silver')),
  price_aud DECIMAL(10, 4) NOT NULL,
  recorded_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate daily entries
ALTER TABLE price_history 
ADD CONSTRAINT unique_metal_date UNIQUE (metal_type, recorded_date);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_price_history_metal_date ON price_history (metal_type, recorded_date);

-- Remove price_usd column from price_cache table
ALTER TABLE price_cache DROP COLUMN IF EXISTS price_usd;
