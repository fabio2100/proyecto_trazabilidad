import "server-only";

import { Pool, type PoolConfig } from "pg";

declare global {
  var postgresPool: Pool | undefined;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsedValue = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function getPoolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_PRISMA_DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_PRISMA_DATABASE_URL environment variable.");
  }

  return {
    connectionString,
    max: parsePositiveInt(process.env.PGPOOL_MAX_CONNECTIONS, 10),
    idleTimeoutMillis: parsePositiveInt(process.env.PGPOOL_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: parsePositiveInt(
      process.env.PGPOOL_CONNECTION_TIMEOUT_MS,
      5000,
    ),
    ssl:
      process.env.PGSSLMODE === "require"
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  };
}

function createPool() {
  return new Pool(getPoolConfig());
}

export function getPool() {
  if (!globalThis.postgresPool) {
    globalThis.postgresPool = createPool();
  }

  return globalThis.postgresPool;
}

export async function checkDatabaseConnection() {
  const client = await getPool().connect();

  try {
    const result = await client.query<{ now: Date }>("SELECT NOW() AS now");

    return {
      ok: true,
      serverTime: result.rows[0]?.now?.toISOString() ?? null,
    };
  } finally {
    client.release();
  }
}
