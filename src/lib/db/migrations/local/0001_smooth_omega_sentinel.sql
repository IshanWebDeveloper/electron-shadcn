CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`target` text DEFAULT 'All Customers' NOT NULL,
	`sent_count` integer DEFAULT 0 NOT NULL,
	`sent_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`notes` text,
	`total_orders` integer DEFAULT 0 NOT NULL,
	`total_spent` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `set_menus` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`availability` text DEFAULT 'All Day' NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE `tables` ADD `zone` text DEFAULT 'Indoor' NOT NULL;--> statement-breakpoint
CREATE INDEX `menu_item_category_idx` ON `menu_items` (`category_id`);--> statement-breakpoint
CREATE INDEX `order_item_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_item_status_idx` ON `order_items` (`status`);--> statement-breakpoint
CREATE INDEX `order_table_idx` ON `orders` (`table_id`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `order_closed_at_idx` ON `orders` (`closed_at`);