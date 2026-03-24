import { defineConfig } from "drizzle-kit";

const remoteDbUrl =
  process.env.KITO_REMOTE_DB_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/postgres";

export default defineConfig({
  schema: ["./src/lib/db/remote/schema.ts", "./src/lib/db/remote/clients.ts"],
  out: "./src/lib/db/migrations/remote",
  dialect: "postgresql",
  dbCredentials: {
    url: remoteDbUrl,
  },
});
