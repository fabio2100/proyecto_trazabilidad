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
  profesionalSolicitante: string;
}

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query<DiagnosisRow>(
      `SELECT id, "biopsasPrevias", "createdAt" AS created_at, diagnosis, material, "patientId", "profesionalSolicitante"
       FROM "Diagnosis"
       ORDER BY "createdAt" DESC`,

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
