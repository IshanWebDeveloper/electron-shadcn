import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/lib/db/schemas/schemas.ts",
    "./src/lib/db/schemas/clients.ts",
  ],
  out: "./src/lib/db/migrations/local",
  dialect: "sqlite",
  dbCredentials: {
    url: "./kito-pos-dev.db",
  },
});
