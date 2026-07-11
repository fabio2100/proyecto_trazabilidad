import { Pool } from "pg";
import { NextResponse } from "next/server";

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PRISMA_DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT id, status, message, "executedAt"
      FROM "SeedLog"
      ORDER BY "executedAt" DESC
      LIMIT 1
    `);
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "No hay registros de ejecución del seed" },
        { status: 200 }
      );
    }

    const seedLog = result.rows[0];
    return NextResponse.json(
      {
        status: seedLog.status,
        message: seedLog.message,
        executedAt: seedLog.executedAt,
        id: seedLog.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al consultar SeedLog:", error);
    return NextResponse.json(
      { error: "Error al consultar el estado del seed" },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
