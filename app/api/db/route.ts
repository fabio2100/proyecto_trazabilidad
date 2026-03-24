import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await checkDatabaseConnection();

    return NextResponse.json({
      ok: result.ok,
      checkedAt: new Date().toISOString(),
      serverTime: result.serverTime,
      message: "Database connection successful.",
    });
  } catch (error) {
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Unable to connect to the database.";

    return NextResponse.json(
      {
        ok: false,
        checkedAt: new Date().toISOString(),
        message,
      },
      {
        status: 500,
      },
    );
  }
}
