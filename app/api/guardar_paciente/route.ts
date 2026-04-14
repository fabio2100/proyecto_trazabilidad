import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GuardarPacienteBody {
  dni: string;
  nombre: string;
  apellido: string;
  edad: string;
  email: string;
  telefono?: string;
  diagnostico: string;
  material: string;
  profesionalSolicitante: string;
  biopsiasPrevias: string;
}

interface PatientRow {
  nombre: string;
  apellido: string;
  age: number;
  email: string;
  telefono: string | null;
}

export async function POST(request: NextRequest) {
  let body: GuardarPacienteBody;

  try {
    body = (await request.json()) as GuardarPacienteBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Cuerpo de solicitud inválido.' },
      { status: 400 },
    );
  }

  const {
    dni,
    nombre,
    apellido,
    edad,
    email,
    telefono,
    diagnostico,
    material,
    profesionalSolicitante,
    biopsiasPrevias,
  } = body;

  if (!dni || !nombre || !apellido || !edad || !email || !material || !profesionalSolicitante || !biopsiasPrevias) {
    return NextResponse.json(
      { ok: false, message: 'Faltan campos obligatorios.' },
      { status: 400 },
    );
  }

  const age = parseInt(edad, 10);
  if (isNaN(age) || age <= 0) {
    return NextResponse.json(
      { ok: false, message: 'La edad debe ser un número válido.' },
      { status: 400 },
    );
  }

  const biopsiasPreviasBool = biopsiasPrevias === 'Si';

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Manejo de la tabla Patients (upsert manual)
    const patientResult = await client.query<PatientRow>(
      'SELECT nombre, apellido, age, email, telefono FROM "Patients" WHERE dni = $1',
      [dni],
    );

    const existing = patientResult.rows[0] ?? null;
    const telefonoValue = telefono?.trim() || null;

    if (!existing) {
      // Paciente nuevo: insertar
      await client.query(
        'INSERT INTO "Patients" (dni, nombre, apellido, age, email, telefono) VALUES ($1, $2, $3, $4, $5, $6)',
        [dni, nombre, apellido, age, email, telefonoValue],
      );
    } else {
      // Paciente existente: actualizar solo si cambió algo
      const changed =
        existing.nombre !== nombre ||
        existing.apellido !== apellido ||
        existing.age !== age ||
        existing.email !== email ||
        (existing.telefono ?? null) !== (telefonoValue ?? null);

      if (changed) {
        await client.query(
          'UPDATE "Patients" SET nombre = $2, apellido = $3, age = $4, email = $5, telefono = $6 WHERE dni = $1',
          [dni, nombre, apellido, age, email, telefonoValue],
        );
      }
    }

    // 2. Insertar nuevo Diagnosis
    await client.query(
      `INSERT INTO "Diagnosis" (id, "patientId", diagnosis, material, "profesionalSolicitante", "biopsasPrevias")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), dni, diagnostico ?? '', material, profesionalSolicitante, biopsiasPreviasBool],
    );

    await client.query('COMMIT');

    return NextResponse.json({ ok: true, message: 'Paciente y diagnóstico guardados correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[guardar_paciente] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo guardar el paciente. Intente nuevamente.' },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
