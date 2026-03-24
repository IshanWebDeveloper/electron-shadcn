import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Staff ────────────────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull(), // bcrypt hashed
  role: text("role", {
    enum: ["admin", "cashier", "waiter", "kitchen"],
  }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Menu Categories ──────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🍽️"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuItems = pgTable("menu_items", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  trackInventory: boolean("track_inventory").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Modifiers ────────────────────────────────────────────────────────────────
export const modifierGroups = pgTable("modifier_groups", {
  id: text("id").primaryKey(),
  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  name: text("name").notNull(),
  required: boolean("required").notNull().default(false),
  multiSelect: boolean("multi_select").notNull().default(false),
});

export const modifierOptions = pgTable("modifier_options", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => modifierGroups.id),
  name: text("name").notNull(),
  priceAdjustment: real("price_adjustment").notNull().default(0),
});

// ─── Tables ───────────────────────────────────────────────────────────────────
export const tables = pgTable("tables", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull().default(4),
  status: text("status", {
    enum: ["available", "occupied", "reserved", "dirty"],
  })
    .notNull()
    .default("available"),
  zone: text("zone").notNull().default("Indoor"),
  posX: real("pos_x").notNull().default(0),
  posY: real("pos_y").notNull().default(0),
});

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  tableId: text("table_id").references(() => tables.id),
  staffId: text("staff_id").references(() => staff.id),
  customerId: text("customer_id"),
  type: text("type", { enum: ["dine_in", "takeaway", "delivery"] })
    .notNull()
    .default("dine_in"),
  status: text("status", {
    enum: [
      "open",
      "sent_to_kitchen",
      "partially_ready",
      "ready",
      "billed",
      "paid",
      "voided",
    ],
  })
    .notNull()
    .default("open"),
  covers: integer("covers").notNull().default(1),
  subtotal: real("subtotal").notNull().default(0),
  taxAmount: real("tax_amount").notNull().default(0),
  discountAmount: real("discount_amount").notNull().default(0),
  total: real("total").notNull().default(0),
  notes: text("notes"),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  name: text("name").notNull(), // snapshot
  price: real("price").notNull(), // snapshot
  quantity: integer("quantity").notNull().default(1),
  modifiers: text("modifiers").notNull().default("[]"), // JSON
  notes: text("notes"),
  status: text("status", {
    enum: ["pending", "in_kitchen", "ready", "served", "voided"],
  })
    .notNull()
    .default("pending"),
  sentAt: timestamp("sent_at"),
  readyAt: timestamp("ready_at"),
});

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  method: text("method", { enum: ["cash", "card", "qr"] }).notNull(),
  amount: real("amount").notNull(),
  tendered: real("tendered"), // for cash
  change: real("change"), // for cash
  reference: text("reference"), // card/QR ref
  paidAt: timestamp("paid_at").notNull().defaultNow(),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),
  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  stockQty: real("stock_qty").notNull().default(0),
  unit: text("unit").notNull().default("pcs"),
  lowStockThreshold: real("low_stock_threshold").notNull().default(5),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Campaigns ────────────────────────────────────────────────────────────────
export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  target: text("target").notNull().default("All Customers"),
  sentCount: integer("sent_count").notNull().default(0),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

// ─── Set Menus ────────────────────────────────────────────────────────────────
export const setMenus = pgTable("set_menus", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  availability: text("availability").notNull().default("All Day"),
  items: text("items").notNull().default("[]"), // JSON string array
  active: boolean("active").notNull().default(true),
});
