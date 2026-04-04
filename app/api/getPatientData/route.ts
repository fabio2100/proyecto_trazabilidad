import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PatientLookupRow {
  apellido: string;
  nombre: string;
  email: string;
  age: number;
}

export async function GET(request: NextRequest) {
  const dni = request.nextUrl.searchParams.get('dni')?.trim() ?? '';

  if (!dni) {
    return NextResponse.json(
      {
        ok: false,
        message: 'El parámetro dni es obligatorio.',
      },
      { status: 400 },
    );
  }

  if (!/^\d+$/.test(dni)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'El parámetro dni debe ser numérico.',
      },
      { status: 400 },
    );
  }

  try {
    const pool = getPool();
    const result = await pool.query<PatientLookupRow>(
      'SELECT apellido, nombre, email, age FROM "Patients" WHERE dni = $1 LIMIT 1',
      [dni],
    );

    const patient = result.rows[0];

    if (!patient) {
      return NextResponse.json({
        ok: true,
        patient: null,
      });
    }

    return NextResponse.json({
      ok: true,
      patient: {
        apellido: patient.apellido,
        nombre: patient.nombre,
        email: patient.email,
        edad: String(patient.age),
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: 'No se pudo obtener la información del paciente.',
      },
      { status: 500 },
    );
  }
}
