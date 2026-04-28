import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GuardarInformeBody {
  diagnosisId: string;
  informe: string;
}

interface PostgresError {
  code?: string;
  constraint?: string;
}

export async function POST(request: NextRequest) {
  let body: GuardarInformeBody;

  try {
    body = (await request.json()) as GuardarInformeBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Cuerpo de solicitud inválido.' },
      { status: 400 },
    );
  }

  const diagnosisId = body.diagnosisId?.trim() ?? '';
  const informe = body.informe?.trim() ?? '';

  if (!diagnosisId || !informe) {
    return NextResponse.json(
      { ok: false, message: 'Los campos diagnosisId e informe son obligatorios.' },
      { status: 400 },
    );
  }

  try {
    const pool = getPool();

    await pool.query(
      `INSERT INTO "Informes" (id, "diagnosisId", cuerpo, "userId")
       VALUES ($1, $2, $3, $4)`,
      [randomUUID(), diagnosisId, informe, '1'],
    );

    return NextResponse.json({ ok: true, message: 'Informe guardado correctamente.' });
  } catch (error) {
    const postgresError = error as PostgresError;

    if (postgresError.code === '23505' && postgresError.constraint === 'Informes_diagnosisId_key') {
      return NextResponse.json(
        { ok: false, message: 'Ya existe un informe para este diagnóstico.' },
        { status: 409 },
      );
    }

    console.error('[guardarInforme] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo guardar el informe.' },
      { status: 500 },
    );
  }
}