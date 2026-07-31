import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

const SUPERUSUARIO_PERFIL_ID = 4;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

interface PatientRow {
  dni: string;
  nombre: string;
  apellido: string;
  age: number;
  email: string;
  telefono: string | null;
  createdAt: Date;
}

interface PatientPayload {
  dni?: string;
  nombre?: string;
  apellido?: string;
  age?: number;
  email?: string;
  telefono?: string | null;
}

interface DeleteSummary {
  diagnoses: number;
  notasTecnico: number;
  informes: number;
}

async function requireSuperusuario(request: NextRequest): Promise<string | NextResponse> {
  const token = request.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ success: false, message: 'No autenticado.' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const pool = getPool();
    const result = await pool.query<{ perfilId: number }>(
      'SELECT "perfilId" FROM "Users" WHERE id = $1',
      [payload.userId],
    );
    const user = result.rows[0];
    if (!user || user.perfilId !== SUPERUSUARIO_PERFIL_ID) {
      return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 403 });
    }
    return payload.userId;
  } catch {
    return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 401 });
  }
}

function isValidEmail(value: string): boolean {
  return value.includes('@');
}

function parsePositiveAge(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const authResult = await requireSuperusuario(request);
  if (authResult instanceof NextResponse) return authResult;

  const dni = request.nextUrl.searchParams.get('dni')?.trim();
  const pool = getPool();

  if (dni) {
    const patientExists = await pool.query<{ dni: string }>(
      'SELECT dni FROM "Patients" WHERE dni = $1',
      [dni],
    );

    if (patientExists.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Paciente no encontrado.' }, { status: 404 });
    }

    const summaryResult = await pool.query<DeleteSummary>(
      `SELECT
          (SELECT COUNT(*)::int FROM "Diagnosis" d WHERE d."patientId" = $1) AS diagnoses,
          (SELECT COUNT(*)::int
           FROM "NotasDelTecnico" n
           JOIN "Diagnosis" d ON d.id = n."diagnosisId"
           WHERE d."patientId" = $1) AS "notasTecnico",
          (SELECT COUNT(*)::int
           FROM "Informes" i
           JOIN "Diagnosis" d ON d.id = i."diagnosisId"
           WHERE d."patientId" = $1) AS informes`,
      [dni],
    );

    return NextResponse.json({
      success: true,
      summary: summaryResult.rows[0] ?? { diagnoses: 0, notasTecnico: 0, informes: 0 },
    });
  }

  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const rawOffset = Number(request.nextUrl.searchParams.get('offset') ?? 0);
  const search = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limit = Number.isInteger(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  const values: Array<string | number> = [];
  let whereClause = '';

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    const searchParam = `$${values.length}`;
    whereClause = `
      WHERE (
        LOWER(COALESCE(dni, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(nombre, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(apellido, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(email, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(telefono, '')) LIKE ${searchParam}
        OR CAST(age AS TEXT) LIKE ${searchParam}
      )`;
  }

  values.push(limit + 1, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;

  const result = await pool.query<PatientRow>(`
    SELECT dni, nombre, apellido, age, email, telefono, "createdAt"
    FROM "Patients"
    ${whereClause}
    ORDER BY "createdAt" DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `, values);

  const hasMore = result.rows.length > limit;
  const patients = hasMore ? result.rows.slice(0, limit) : result.rows;

  return NextResponse.json({ patients, hasMore });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSuperusuario(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: PatientPayload;
  try {
    body = (await request.json()) as PatientPayload;
  } catch {
    return NextResponse.json({ success: false, message: 'Cuerpo inválido.' }, { status: 400 });
  }

  const dni = body.dni?.trim();
  const nombre = body.nombre?.trim();
  const apellido = body.apellido?.trim();
  const email = body.email?.trim().toLowerCase();
  const telefono = body.telefono?.trim() || null;
  const age = parsePositiveAge(body.age);

  if (!dni || !nombre || !apellido || !email || age === null) {
    return NextResponse.json(
      { success: false, message: 'DNI, nombre, apellido, edad y email son requeridos.' },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, message: 'Email inválido.' }, { status: 400 });
  }

  const pool = getPool();

  const existingDni = await pool.query<{ dni: string }>(
    'SELECT dni FROM "Patients" WHERE dni = $1',
    [dni],
  );
  if (existingDni.rows.length > 0) {
    return NextResponse.json({ success: false, message: 'El DNI ya existe.' }, { status: 409 });
  }

  const existingEmail = await pool.query<{ dni: string }>(
    'SELECT dni FROM "Patients" WHERE email = $1',
    [email],
  );
  if (existingEmail.rows.length > 0) {
    return NextResponse.json({ success: false, message: 'El email ya está en uso.' }, { status: 409 });
  }

  await pool.query(
    `INSERT INTO "Patients" (dni, nombre, apellido, age, email, telefono)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [dni, nombre, apellido, age, email, telefono],
  );

  return NextResponse.json(
    { success: true, message: 'Paciente creado correctamente.', dni },
    { status: 201 },
  );
}

export async function PUT(request: NextRequest) {
  const authResult = await requireSuperusuario(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: PatientPayload;
  try {
    body = (await request.json()) as PatientPayload;
  } catch {
    return NextResponse.json({ success: false, message: 'Cuerpo inválido.' }, { status: 400 });
  }

  const dni = body.dni?.trim();
  if (!dni) {
    return NextResponse.json({ success: false, message: 'DNI del paciente requerido.' }, { status: 400 });
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (body.nombre !== undefined) {
    fields.push(`nombre = $${idx++}`);
    values.push(body.nombre.trim());
  }

  if (body.apellido !== undefined) {
    fields.push(`apellido = $${idx++}`);
    values.push(body.apellido.trim());
  }

  if (body.age !== undefined) {
    const age = parsePositiveAge(body.age);
    if (age === null) {
      return NextResponse.json({ success: false, message: 'La edad debe ser un número válido.' }, { status: 400 });
    }
    fields.push(`age = $${idx++}`);
    values.push(age);
  }

  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, message: 'Email inválido.' }, { status: 400 });
    }

    const pool = getPool();
    const existingEmail = await pool.query<{ dni: string }>(
      'SELECT dni FROM "Patients" WHERE email = $1 AND dni <> $2',
      [email, dni],
    );
    if (existingEmail.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'El email ya está en uso.' }, { status: 409 });
    }

    fields.push(`email = $${idx++}`);
    values.push(email);
  }

  if (body.telefono !== undefined) {
    fields.push(`telefono = $${idx++}`);
    values.push(body.telefono?.trim() || null);
  }

  if (fields.length === 0) {
    return NextResponse.json({ success: false, message: 'Sin campos para actualizar.' }, { status: 400 });
  }

  values.push(dni);
  const pool = getPool();
  const result = await pool.query(
    `UPDATE "Patients" SET ${fields.join(', ')} WHERE dni = $${idx} RETURNING dni`,
    values,
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ success: false, message: 'Paciente no encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Paciente actualizado correctamente.' });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireSuperusuario(request);
  if (authResult instanceof NextResponse) return authResult;

  const dni = request.nextUrl.searchParams.get('dni')?.trim();

  if (!dni) {
    return NextResponse.json({ success: false, message: 'DNI del paciente requerido.' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const patientResult = await client.query<{ dni: string }>(
      'SELECT dni FROM "Patients" WHERE dni = $1',
      [dni],
    );

    if (patientResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, message: 'Paciente no encontrado.' }, { status: 404 });
    }

    const diagnosisRows = await client.query<{ id: string }>(
      'SELECT id FROM "Diagnosis" WHERE "patientId" = $1',
      [dni],
    );

    const diagnosisIds = diagnosisRows.rows.map((row) => row.id);

    if (diagnosisIds.length > 0) {
      await client.query(
        `DELETE FROM "SharedReportLink"
         WHERE "informeId" IN (
           SELECT id FROM "Informes" WHERE "diagnosisId" = ANY($1::text[])
         )`,
        [diagnosisIds],
      );

      await client.query(
        'DELETE FROM "Auditoria" WHERE "diagnosisId" = ANY($1::text[])',
        [diagnosisIds],
      );

      await client.query(
        'DELETE FROM "Informes" WHERE "diagnosisId" = ANY($1::text[])',
        [diagnosisIds],
      );

      await client.query(
        'DELETE FROM "NotasDelTecnico" WHERE "diagnosisId" = ANY($1::text[])',
        [diagnosisIds],
      );

      await client.query(
        'DELETE FROM "Diagnosis" WHERE id = ANY($1::text[])',
        [diagnosisIds],
      );
    }

    await client.query('DELETE FROM "Patients" WHERE dni = $1', [dni]);

    await client.query('COMMIT');

    return NextResponse.json({ success: true, message: 'Paciente y registros asociados eliminados correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[admin/patients DELETE]', error);
    return NextResponse.json(
      { success: false, message: 'Error al eliminar el paciente y sus registros asociados.' },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}