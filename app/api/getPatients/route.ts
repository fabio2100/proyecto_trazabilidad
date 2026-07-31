import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
    const rawOffset = Number(searchParams.get('offset') ?? 0);
    const search = searchParams.get('q')?.trim() ?? '';
    const limit = Number.isInteger(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;
    const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

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

    const values: Array<string | number> = [];
    let whereClause = 'WHERE d.eliminado = false';

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      const searchParam = `$${values.length}`;
      whereClause += `
        AND (
          LOWER(COALESCE(p.nombre, '')) LIKE ${searchParam}
          OR LOWER(COALESCE(p.apellido, '')) LIKE ${searchParam}
          OR LOWER(COALESCE(d."patientId", '')) LIKE ${searchParam}
          OR LOWER(COALESCE(d.diagnosis, '')) LIKE ${searchParam}
          OR LOWER(COALESCE(d.material, '')) LIKE ${searchParam}
          OR LOWER(COALESCE(d."profesionalSolicitante", '')) LIKE ${searchParam}
          OR LOWER(COALESCE(d."sampleCode", '')) LIKE ${searchParam}
          OR LOWER(CASE WHEN i.id IS NOT NULL THEN 'disponible' ELSE 'pendiente' END) LIKE ${searchParam}
        )`;
    }

    values.push(limit + 1, offset);
    const limitParam = `$${values.length - 1}`;
    const offsetParam = `$${values.length}`;

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
       ${whereClause}
       ORDER BY d."createdAt" DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      values,
    );

    const hasMore = result.rows.length > limit;
    const data = hasMore ? result.rows.slice(0, limit) : result.rows;

    return NextResponse.json({ ok: true, data, hasMore });
  } catch (error) {
    console.error('[getPatients] Error completo:', error);
    return NextResponse.json(
      { ok: false, message: 'Error al obtener los datos de diagnósticos.' },
      { status: 500 },
    );
  }
}