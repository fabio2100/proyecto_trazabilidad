import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

interface StatsRow {
  patients: string;
  diagnoses: string;
  notas: string;
  informes: string;
}

export async function GET() {
  const pool = getPool();
  const result = await pool.query<StatsRow>(`
    SELECT
      (SELECT COUNT(*) FROM "Patients")        AS patients,
      (SELECT COUNT(*) FROM "Diagnosis")       AS diagnoses,
      (SELECT COUNT(*) FROM "NotasDelTecnico") AS notas,
      (SELECT COUNT(*) FROM "Informes")        AS informes
  `);

  const row = result.rows[0];
  return NextResponse.json({
    patients:  Number(row.patients),
    diagnoses: Number(row.diagnoses),
    notas:     Number(row.notas),
    informes:  Number(row.informes),
  });
}
