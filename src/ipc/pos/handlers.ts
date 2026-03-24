import { os } from "@orpc/server";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../lib/db";
import { syncToRemote } from "../../lib/db/remote";
import {
  campaigns,
  categories,
  customers,
  menuItems,
  orderItems,
  orders,
  setMenus,
  tables,
} from "../../lib/db/schemas/schemas";

const createId = (prefix: string): string => {
  return `${prefix}_${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

export const getTables = os.handler(() => {
  const db = getDb();
  return db.select().from(tables).all();
});

export const getMenu = os.handler(() => {
  const db = getDb();
  const cats = db.select().from(categories).all();
  const items = db.select().from(menuItems).all();

  return cats.map((category) => ({
    ...category,
    items: items.filter((item) => item.categoryId === category.id),
  }));
});

export const getActiveOrderForTable = os
  .input(z.object({ tableId: z.string() }))
  .handler(({ input }) => {
    const db = getDb();
    const activeOrder = db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tableId, input.tableId),
          inArray(orders.status, [
            "open",
            "sent_to_kitchen",
            "partially_ready",
            "ready",
            "billed",
          ])
        )
      )
      .get();

    if (!activeOrder) {
      return null;
    }

    const items = db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, activeOrder.id))
      .all();

    return { ...activeOrder, items };
  });

export const createOrder = os
  .input(
    z.object({
      tableId: z.string(),
      type: z.enum(["dine_in", "takeaway", "delivery"]).optional(),
      customerId: z.string().optional().nullable(),
    })
  )
  .handler(({ input }) => {
    const db = getDb();
    const id = createId("ord");

    db.update(tables)
      .set({ status: "occupied" })
      .where(eq(tables.id, input.tableId))
      .run();

    db.insert(orders)
      .values({
        id,
        tableId: input.tableId,
        customerId: input.customerId ?? null,
        type: input.type ?? "dine_in",
        status: "open",
      })
      .run();

    return { id };
  });

export const addOrderItem = os
  .input(
    z.object({
      orderId: z.string(),
      menuItemId: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
    })
  )
  .handler(({ input }) => {
    const db = getDb();
    const id = createId("itm");

    db.insert(orderItems)
      .values({
        id,
        orderId: input.orderId,
        menuItemId: input.menuItemId,
        name: input.name,
        price: input.price,
        quantity: input.quantity,
        status: "pending",
      })
      .run();

    return { success: true };
  });

export const updateOrderItemQuantity = os
  .input(
    z.object({ orderItemId: z.string(), quantity: z.number().int().min(0) })
  )
  .handler(({ input }) => {
    const db = getDb();

    if (input.quantity === 0) {
      db.delete(orderItems).where(eq(orderItems.id, input.orderItemId)).run();
      return { success: true };
    }

    db.update(orderItems)
      .set({ quantity: input.quantity })
      .where(eq(orderItems.id, input.orderItemId))
      .run();

    return { success: true };
  });

export const removeOrderItem = os
  .input(z.object({ orderItemId: z.string() }))
  .handler(({ input }) => {
    const db = getDb();
    db.delete(orderItems).where(eq(orderItems.id, input.orderItemId)).run();
    return { success: true };
  });

export const sendToKitchen = os
  .input(z.object({ orderId: z.string() }))
  .handler(({ input }) => {
    const db = getDb();

    db.update(orders)
      .set({ status: "sent_to_kitchen" })
      .where(eq(orders.id, input.orderId))
      .run();

    db.update(orderItems)
      .set({ status: "in_kitchen" })
      .where(
        and(
          eq(orderItems.orderId, input.orderId),
          eq(orderItems.status, "pending")
        )
      )
      .run();

    return { success: true };
  });

export const payOrder = os
  .input(
    z.object({ orderId: z.string(), tableId: z.string(), amount: z.number() })
  )
  .handler(({ input }) => {
    const db = getDb();

    db.update(orders)
      .set({ status: "paid", total: input.amount, closedAt: new Date() })
      .where(eq(orders.id, input.orderId))
      .run();

    db.update(tables)
      .set({ status: "available" })
      .where(eq(tables.id, input.tableId))
      .run();

    return { success: true };
  });

export const getKOTs = os.handler(() => {
  const db = getDb();
  const kots = db
    .select()
    .from(orders)
    .where(
      inArray(orders.status, ["sent_to_kitchen", "partially_ready", "ready"])
    )
    .all();

  if (kots.length === 0) {
    return [];
  }

  const items = db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        kots.map((kot) => kot.id)
      )
    )
    .all();

  return kots.map((kot) => ({
    ...kot,
    items: items.filter((item) => item.orderId === kot.id),
  }));
});

export const updateKOTStatus = os
  .input(
    z.object({
      orderId: z.string(),
      status: z.enum(["sent_to_kitchen", "partially_ready", "ready"]),
    })
  )
  .handler(({ input }) => {
    const db = getDb();
    db.update(orders)
      .set({ status: input.status })
      .where(eq(orders.id, input.orderId))
      .run();
    return { success: true };
  });

export const getCustomers = os.handler(() => {
  const db = getDb();
  return db.select().from(customers).all();
});

export const getCampaigns = os.handler(() => {
  const db = getDb();
  return db.select().from(campaigns).all();
});

export const getSetMenus = os.handler(() => {
  const db = getDb();
  return db.select().from(setMenus).all();
});

export const syncData = os.handler(() => {
  return syncToRemote();
});

export const createTable = os
  .input(
    z.object({
      name: z.string(),
      capacity: z.number(),
      zone: z.string().optional(),
    })
  )
  .handler(({ input }) => {
    const db = getDb();
    const id = createId("tbl");

    db.insert(tables)
      .values({
        id,
        name: input.name,
        capacity: input.capacity,
        zone: input.zone ?? "Main Hall",
        status: "available",
      })
      .run();

    return { id };
  });

export const updateTableStatus = os
  .input(
    z.object({
      tableId: z.string(),
      status: z.enum(["available", "occupied", "reserved", "dirty"]),
    })
  )
  .handler(({ input }) => {
    const db = getDb();

    db.update(tables)
      .set({ status: input.status })
      .where(eq(tables.id, input.tableId))
      .run();

    return { success: true };
  });

export const createCustomer = os
  .input(
    z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string().optional(),
    })
  )
  .handler(({ input }) => {
    const db = getDb();
    const id = createId("cust");

    db.insert(customers)
      .values({
        id,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        totalOrders: 0,
        totalSpent: 0,
      })
      .run();

    return { id };
  });

export const createCampaign = os
  .input(
    z.object({
      name: z.string(),
      message: z.string(),
      target: z.string().optional(),
    })
  )
  .handler(({ input }) => {
    const db = getDb();
    const id = createId("cmp");

    db.insert(campaigns)
      .values({
        id,
        name: input.name,
        message: input.message,
        target: input.target ?? "All Customers",
        sentCount: 0,
      })
      .run();

    return { id };
  });

export const createMenuItem = os
  .input(
    z.object({
      categoryId: z.string(),
      name: z.string(),
      price: z.number(),
      description: z.string().optional(),
    })
  )
  .handler(({ input }) => {
    const db = getDb();
    const id = createId("mi");

    db.insert(menuItems)
      .values({
        id,
        categoryId: input.categoryId,
        name: input.name,
        price: input.price,
        description: input.description,
        available: true,
      })
      .run();

    return { id };
  });

export const createCategory = os
  .input(
    z.object({
      name: z.string(),
      emoji: z.string(),
    })
  )
  .handler(({ input }) => {
    const db = getDb();
    const id = createId("cat");

    db.insert(categories)
      .values({
        id,
        name: input.name,
        emoji: input.emoji,
        active: true,
      })
      .run();

    return { id };
  });

export const createSetMenu = os
  .input(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      availability: z.string().optional(),
      items: z.array(z.string()).optional(),
    })
  )
  .handler(({ input }) => {
    const db = getDb();
    const id = createId("set");

    db.insert(setMenus)
      .values({
        id,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        availability: input.availability ?? "All Day",
        items: JSON.stringify(input.items ?? []),
        active: true,
      })
      .run();

    return { id };
  });

export const getDashboardStats = os.handler(() => {
  const db = getDb();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayOrders = db
    .select()
    .from(orders)
    .where(and(eq(orders.status, "paid"), gte(orders.closedAt, startOfDay)))
    .all();

  const revenue = todayOrders.reduce(
    (acc, order) => acc + (order.total || 0),
    0
  );

  const activeTablesCount = db
    .select({ count: sql<number>`count(*)` })
    .from(tables)
    .where(sql`${tables.status} != 'available'`)
    .get();

  const totalTablesCount = db
    .select({ count: sql<number>`count(*)` })
    .from(tables)
    .get();

  return {
    revenue,
    todayOrders: todayOrders.length,
    activeTables: activeTablesCount?.count ?? 0,
    totalTables: totalTablesCount?.count ?? 0,
  };
});
