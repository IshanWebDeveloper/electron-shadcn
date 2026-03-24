import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { dbUrl } from "./db-consts";
import { schema } from "./schemas";

const queryClient = postgres(dbUrl);
export const db = drizzle(queryClient, { schema });
