import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DiagnosisRow {
  id: string;
  biopsasPrevias: boolean;
  created_at: Date;
  diagnosis: string;
  material: string;
  patientId: string;
  patientNombre: string | null;
  patientApellido: string | null;
  profesionalSolicitante: string;
  hasInforme: boolean;
  informeId: string | null;
}

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query<DiagnosisRow>(
      `SELECT d.id,
              d."biopsasPrevias",
              d."createdAt" AS created_at,
              d.diagnosis,
              d.material,
              d."patientId",
              p.nombre AS "patientNombre",
              p.apellido AS "patientApellido",
              d."profesionalSolicitante",
              (i.id IS NOT NULL) AS "hasInforme",
              i.id AS "informeId"
       FROM "Diagnosis" d
       LEFT JOIN "Patients" p ON d."patientId" = p.dni
       LEFT JOIN "Informes" i ON i."diagnosisId" = d.id
       ORDER BY d."createdAt" DESC`,
    );

    return NextResponse.json({ ok: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener diagnósticos:', error);
    return NextResponse.json(
      { ok: false, message: 'Error al obtener los datos de diagnósticos.' },
      { status: 500 },
    );
  }
}
