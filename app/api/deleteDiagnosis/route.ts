import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.json({ ok: false, message: 'No autenticado.' }, { status: 401 });
  }

  let userId: string;
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ ok: false, message: 'Token inválido.' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, message: 'El parámetro id es requerido.' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const check = await client.query<{ id: string }>(
      'SELECT id FROM "Diagnosis" WHERE id = $1 AND eliminado = false',
      [id],
    );
    if (check.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ ok: false, message: 'Diagnóstico no encontrado.' }, { status: 404 });
    }

    // Soft-delete en Diagnosis
    await client.query('UPDATE "Diagnosis" SET eliminado = true WHERE id = $1', [id]);

    // Soft-delete en Informes relacionado (si existe)
    await client.query('UPDATE "Informes" SET eliminado = true WHERE "diagnosisId" = $1', [id]);

    // Soft-delete en NotasDelTecnico relacionado (si existe)
    await client.query('UPDATE "NotasDelTecnico" SET eliminado = true WHERE "diagnosisId" = $1', [id]);

    // Registrar en Auditoria
    await client.query(
      'INSERT INTO "Auditoria" (id, "userId", "diagnosisId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      [userId, id],
    );

    await client.query('COMMIT');
    return NextResponse.json({ ok: true, message: 'Diagnóstico eliminado correctamente.' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[deleteDiagnosis]', e);
    return NextResponse.json({ ok: false, message: 'Error al eliminar el diagnóstico.' }, { status: 500 });
  } finally {
    client.release();
  }
}
