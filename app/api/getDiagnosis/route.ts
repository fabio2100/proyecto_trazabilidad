import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DiagnosisRow {
  id: string;
  patientId: string;
  diagnosis: string;
  material: string;
  profesionalSolicitante: string;
  biopsasPrevias: boolean;
  createdAt: Date;
  informeId: string | null;
  informeCuerpo: string | null;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim() ?? '';

  if (!id) {
    return NextResponse.json(
      { ok: false, message: 'El parámetro id es requerido.' },
      { status: 400 },
    );
  }

  try {
    const pool = getPool();
    const result = await pool.query<DiagnosisRow>(
      `SELECT d.id, d."patientId", d.diagnosis, d.material, d."profesionalSolicitante", d."biopsasPrevias", d."createdAt",
              i.id AS "informeId", i.cuerpo AS "informeCuerpo"
       FROM "Diagnosis" d
       LEFT JOIN "Informes" i ON i."diagnosisId" = d.id
       WHERE d.id = $1
       LIMIT 1`,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Estudio no encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener diagnóstico:', error);
    return NextResponse.json(
      { ok: false, message: 'Error al obtener el diagnóstico.' },
      { status: 500 },
    );
  }
}
