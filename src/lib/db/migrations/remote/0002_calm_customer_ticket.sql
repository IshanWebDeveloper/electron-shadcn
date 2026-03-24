ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS order_customer_idx ON orders (customer_id);
