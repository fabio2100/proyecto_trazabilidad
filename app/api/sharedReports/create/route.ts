import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, randomInt } from 'crypto';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SharedReportBody {
  informeId?: string;
}

function generatePassword(): string {
  return String(randomInt(0, 1000000)).padStart(6, '0');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SharedReportBody;
    const informeId = body.informeId?.trim() ?? '';

    if (!informeId) {
      return NextResponse.json(
        { ok: false, message: 'El campo informeId es obligatorio.' },
        { status: 400 },
      );
    }

    const pool = getPool();
    const informeResult = await pool.query(
      'SELECT id FROM "Informes" WHERE id = $1',
      [informeId],
    );

    if (informeResult.rows.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Informe no encontrado.' },
        { status: 404 },
      );
    }

    const token = randomUUID();
    const password = generatePassword();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO "SharedReportLink" (id, token, password, "informeId", "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [randomUUID(), token, password, informeId, expiresAt],
    );

    const origin = request.headers.get('origin') ?? 'http://localhost:3000';
    const link = `${origin.replace(/\/$/, '')}/consulta/${token}`;

    return NextResponse.json({
      ok: true,
      link,
      password,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[sharedReports/create] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo crear el link compartido. Intente nuevamente.' },
      { status: 500 },
    );
  }
}
