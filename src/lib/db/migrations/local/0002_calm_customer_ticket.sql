ALTER TABLE `orders` ADD `customer_id` text;
--> statement-breakpoint
CREATE INDEX `order_customer_idx` ON `orders` (`customer_id`);
