const fallbackDbUrl = "postgresql://postgres:postgres@localhost:5432/postgres";

// Prioritize explicit environment configuration for packaged deployments.
export const dbUrl =
  process.env.KITO_REMOTE_DB_URL ?? process.env.DATABASE_URL ?? fallbackDbUrl;
