import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DiagnosisRow {
  id: string;
  biopsasPrevias: boolean;
  estudioPrevioFecha: string | null;
  created_at: Date;
  diagnosis: string;
  material: string;
  patientId: string;
  patientNombre: string | null;
  patientApellido: string | null;
  profesionalSolicitante: string;
  sampleCode: string | null;
  hasInforme: boolean;
  informeId: string | null;
  hasNotasTecnico: boolean;
}

export async function GET() {
  try {
    const pool = getPool();

    const notasTableCheck = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'NotasDelTecnico'
      ) AS exists`,
    );

    const hasNotasTable = notasTableCheck.rows[0]?.exists === true;
    const notasJoin = hasNotasTable
      ? 'LEFT JOIN "NotasDelTecnico" n ON n."diagnosisId" = d.id'
      : '';
    const notasSelect = hasNotasTable
      ? '(n.id IS NOT NULL) AS "hasNotasTecnico"'
      : 'FALSE AS "hasNotasTecnico"';

    const result = await pool.query<DiagnosisRow>(
      `SELECT d.id,
              d."biopsasPrevias",
              TO_CHAR(d."estudioPrevioFecha", 'YYYY-MM-DD') AS "estudioPrevioFecha",
              d."createdAt" AS created_at,
              d.diagnosis,
              d.material,
              d."patientId",
              p.nombre AS "patientNombre",
              p.apellido AS "patientApellido",
              d."profesionalSolicitante",
              d."sampleCode",
              (i.id IS NOT NULL) AS "hasInforme",
              i.id AS "informeId",
              ${notasSelect}
       FROM "Diagnosis" d
       LEFT JOIN "Patients" p ON d."patientId" = p.dni
       LEFT JOIN "Informes" i ON i."diagnosisId" = d.id
       ${notasJoin}
       ORDER BY d."createdAt" DESC`,
    );

    return NextResponse.json({ ok: true, data: result.rows });
  } catch (error) {
    console.error('[getPatients] Error completo:', error);
    return NextResponse.json(
      { ok: false, message: 'Error al obtener los datos de diagnósticos.' },
      { status: 500 },
    );
  }
}