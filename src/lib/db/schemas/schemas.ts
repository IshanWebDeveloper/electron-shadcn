import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// ─── Staff ────────────────────────────────────────────────────────────────────
export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull(), // bcrypt hashed
  role: text("role", {
    enum: ["admin", "cashier", "waiter", "kitchen"],
  }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Menu Categories ──────────────────────────────────────────────────────────
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🍽️"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuItems = sqliteTable(
  "menu_items",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    description: text("description"),
    price: real("price").notNull(),
    imageUrl: text("image_url"),
    available: integer("available", { mode: "boolean" })
      .notNull()
      .default(true),
    trackInventory: integer("track_inventory", { mode: "boolean" })
      .notNull()
      .default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("menu_item_category_idx").on(table.categoryId)]
);

// ─── Modifiers ────────────────────────────────────────────────────────────────
export const modifierGroups = sqliteTable("modifier_groups", {
  id: text("id").primaryKey(),
  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  name: text("name").notNull(),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  multiSelect: integer("multi_select", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const modifierOptions = sqliteTable("modifier_options", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => modifierGroups.id),
  name: text("name").notNull(),
  priceAdjustment: real("price_adjustment").notNull().default(0),
});

// ─── Tables ───────────────────────────────────────────────────────────────────
export const tables = sqliteTable("tables", {
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
export const orders = sqliteTable(
  "orders",
  {
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
    openedAt: integer("opened_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    closedAt: integer("closed_at", { mode: "timestamp" }),
  },
  (table) => [
    index("order_table_idx").on(table.tableId),
    index("order_status_idx").on(table.status),
    index("order_closed_at_idx").on(table.closedAt),
  ]
);

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = sqliteTable(
  "order_items",
  {
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
    sentAt: integer("sent_at", { mode: "timestamp" }),
    readyAt: integer("ready_at", { mode: "timestamp" }),
  },
  (table) => [
    index("order_item_order_idx").on(table.orderId),
    index("order_item_status_idx").on(table.status),
  ]
);

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  method: text("method", { enum: ["cash", "card", "qr"] }).notNull(),
  amount: real("amount").notNull(),
  tendered: real("tendered"), // for cash
  change: real("change"), // for cash
  reference: text("reference"), // card/QR ref
  paidAt: integer("paid_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventory = sqliteTable("inventory", {
  id: text("id").primaryKey(),
  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  stockQty: real("stock_qty").notNull().default(0),
  unit: text("unit").notNull().default("pcs"),
  lowStockThreshold: real("low_stock_threshold").notNull().default(5),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Campaigns ────────────────────────────────────────────────────────────────
export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  target: text("target").notNull().default("All Customers"),
  sentCount: integer("sent_count").notNull().default(0),
  sentAt: integer("sent_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Set Menus ────────────────────────────────────────────────────────────────
export const setMenus = sqliteTable("set_menus", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  availability: text("availability").notNull().default("All Day"),
  items: text("items").notNull().default("[]"), // JSON string array
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});
