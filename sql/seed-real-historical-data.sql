-- SQL script to populate price_cache and price_history with real historical data
-- Run this after executing the migration in sql/migrations/001_create_price_history.sql

-- 1. First, run the migration if you haven't already:
-- Execute the contents of sql/migrations/001_create_price_history.sql

-- 2. Update price_cache with current prices (latest from your data)
INSERT INTO price_cache (metal_type, price_aud, updated_at) VALUES
('gold', 6544.1, NOW()),  -- Current gold price from Oct 18
('silver', 79.85, NOW())  -- Current silver price from Oct 19
ON CONFLICT (metal_type) DO UPDATE SET
price_aud = EXCLUDED.price_aud,
updated_at = EXCLUDED.updated_at;

-- 3. Insert historical gold prices for the last 7 days
INSERT INTO price_history (metal_type, price_aud, recorded_date) VALUES
('gold', 6544.1, '2025-10-18'),
('gold', 6544.1, '2025-10-17'),
('gold', 6670.6, '2025-10-16'),
('gold', 6465.6, '2025-10-15'),
('gold', 6386.1, '2025-10-14'),
('gold', 6309.0, '2025-10-13'),
('gold', 6183.1, '2025-10-12'),
('gold', 6205.5, '2025-10-11')
ON CONFLICT (metal_type, recorded_date) DO UPDATE SET
price_aud = EXCLUDED.price_aud;

-- 4. Insert historical silver prices for the last 7 days
INSERT INTO price_history (metal_type, price_aud, recorded_date) VALUES
('silver', 80.17, '2025-10-18'),
('silver', 74.04, '2025-10-17'),
('silver', 83.32, '2025-10-16'),
('silver', 73.57, '2025-10-15'),
('silver', 79.57, '2025-10-14'),
('silver', 74.71, '2025-10-13'),
('silver', 79.85, '2025-10-19')  -- Adding the Oct 19 silver price
ON CONFLICT (metal_type, recorded_date) DO UPDATE SET
price_aud = EXCLUDED.price_aud;

-- 5. Verify the data was inserted correctly
SELECT 'price_cache' as table_name, metal_type, price_aud::text as price_aud, updated_at::text as date_time
FROM price_cache 
UNION ALL
SELECT 'price_history' as table_name, metal_type, price_aud::text as price_aud, recorded_date::text as date_time
FROM price_history 
ORDER BY table_name, metal_type, date_time;
