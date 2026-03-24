import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/lib/db/remote/schema.ts", "./src/lib/db/remote/clients.ts"],
  out: "./src/lib/db/migrations/remote",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
