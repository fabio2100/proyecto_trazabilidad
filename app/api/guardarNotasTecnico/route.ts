import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GuardarNotasBody {
  diagnosisId: string;
  cuerpo: string;
}

export async function POST(request: NextRequest) {
  let body: GuardarNotasBody;

  try {
    body = (await request.json()) as GuardarNotasBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Cuerpo de solicitud inválido.' },
      { status: 400 },
    );
  }

  const diagnosisId = body.diagnosisId?.trim() ?? '';
  const cuerpo = body.cuerpo?.trim() ?? '';

  if (!diagnosisId || !cuerpo) {
    return NextResponse.json(
      { ok: false, message: 'Los campos diagnosisId y cuerpo son obligatorios.' },
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
      `INSERT INTO "NotasDelTecnico" (id, "diagnosisId", cuerpo, "userId")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("diagnosisId") DO UPDATE SET cuerpo = EXCLUDED.cuerpo, "userId" = EXCLUDED."userId"`,
      [randomUUID(), diagnosisId, cuerpo, userId],
    );

    return NextResponse.json({ ok: true, message: 'Notas del técnico guardadas correctamente.' });
  } catch (error) {
    console.error('[guardarNotasTecnico] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudieron guardar las notas del técnico.' },
      { status: 500 },
    );
  }
}
