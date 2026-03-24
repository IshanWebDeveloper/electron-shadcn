import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { app } from "electron";
import postgres from "postgres";
import { dbUrl } from "../db-consts";
import { getDb } from "../index"; // SQLite local DB
import {
  campaigns as localCampaigns,
  categories as localCategories,
  customers as localCustomers,
  menuItems as localMenuItems,
  orderItems as localOrderItems,
  orders as localOrders,
  payments as localPayments,
  settings as localSettings,
  staff as localStaff,
  tables as localTables,
} from "../schemas/schemas";
import {
  campaigns as remoteCampaigns,
  categories as remoteCategories,
  customers as remoteCustomers,
  menuItems as remoteMenuItems,
  orderItems as remoteOrderItems,
  orders as remoteOrders,
  payments as remotePayments,
  settings as remoteSettings,
  staff as remoteStaff,
  tables as remoteTables,
} from "./schema";

const remoteSchema = {
  campaigns: remoteCampaigns,
  categories: remoteCategories,
  customers: remoteCustomers,
  menuItems: remoteMenuItems,
  orderItems: remoteOrderItems,
  orders: remoteOrders,
  payments: remotePayments,
  settings: remoteSettings,
  staff: remoteStaff,
  tables: remoteTables,
} as const;

export const queryClient = postgres(dbUrl);
export const remoteDb = drizzle(queryClient, { schema: remoteSchema });

let remoteMigrationsApplied = false;

async function ensureRemoteSchemaForSync() {
  if (remoteMigrationsApplied) {
    return;
  }

  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, "migrations", "remote")
    : path.join(process.cwd(), "src/lib/db/migrations/remote");

  await migrate(remoteDb, { migrationsFolder });

  remoteMigrationsApplied = true;
}

/**
 * Basic demonstration of a one-way sync from Local SQLite -> Remote Postgres.
 * For a real app, you'd use something like ElectricSQL or custom CRDT tracking.
 */
export async function syncToRemote() {
  console.log("[SYNC] Starting baseline sync to remote...");

  const localDb = getDb();

  await ensureRemoteSchemaForSync();

  const tablesToSync = [
    { local: localStaff, remote: remoteStaff, name: "Staff" },
    {
      local: localCategories,
      remote: remoteCategories,
      name: "Categories",
    },
    {
      local: localMenuItems,
      remote: remoteMenuItems,
      name: "Menu Items",
    },
    { local: localTables, remote: remoteTables, name: "Tables" },
    {
      local: localCustomers,
      remote: remoteCustomers,
      name: "Customers",
    },
    {
      local: localCampaigns,
      remote: remoteCampaigns,
      name: "Campaigns",
    },
    { local: localOrders, remote: remoteOrders, name: "Orders" },
    {
      local: localOrderItems,
      remote: remoteOrderItems,
      name: "Order Items",
    },
    {
      local: localPayments,
      remote: remotePayments,
      name: "Payments",
    },
  ];

  for (const table of tablesToSync) {
    const data = localDb.select().from(table.local).all();
    if (data.length > 0) {
      console.log(`[SYNC] Syncing ${data.length} records for ${table.name}...`);
      await remoteDb
        .insert(table.remote)
        .values(data)
        .onConflictDoNothing() // Simplified; for updates, would need target ID
        .execute();
    }
  }

  // Handle settings separately (it has no 'id' but 'key')
  const settingsData = localDb.select().from(localSettings).all();
  if (settingsData.length > 0) {
    await remoteDb
      .insert(remoteSettings)
      .values(settingsData)
      .onConflictDoNothing()
      .execute();
  }

  console.log("[SYNC] Baseline sync completed.");
  return { success: true };
}
