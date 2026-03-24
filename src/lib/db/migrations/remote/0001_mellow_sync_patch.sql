CREATE TABLE IF NOT EXISTS "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"notes" text,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spent" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"target" text DEFAULT 'All Customers' NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS "zone" text DEFAULT 'Indoor' NOT NULL;
