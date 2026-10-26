import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GuardarInformeBody {
  diagnosisId: string;
  diagnostico?: string;
  informe?: string;
  microscopia?: string;
  macroscopia?: string;
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
  const diagnostico = (body.diagnostico ?? body.informe ?? '').trim();
  const microscopia = body.microscopia?.trim() ?? '';
  const macroscopia = body.macroscopia?.trim() ?? '';

  if (!diagnosisId || !diagnostico) {
    return NextResponse.json(
      { ok: false, message: 'Los campos diagnosisId y diagnostico son obligatorios.' },
      { status: 400 },
    );
  }

  try {
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ ok: false, message: 'No autenticado.' }, { status: 401 });
    }
    const { userId } = await verifyToken(sessionToken);

    const pool = getPool();

    await pool.query(
      `INSERT INTO "Informes" (id, "diagnosisId", diagnostico, microscopia, macroscopia, "userId")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("diagnosisId") DO UPDATE
       SET diagnostico = EXCLUDED.diagnostico,
           microscopia = EXCLUDED.microscopia,
           macroscopia = EXCLUDED.macroscopia`,
      [randomUUID(), diagnosisId, diagnostico, microscopia || null, macroscopia || null, userId],
    );

    return NextResponse.json({ ok: true, message: 'Diagnóstico guardado correctamente.' });
  } catch (error) {
    console.error('[guardarInforme] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo guardar el informe.' },
      { status: 500 },
    );
  }
}