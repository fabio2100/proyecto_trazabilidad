import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PatientLookupRow {
  dni: string;
  apellido: string;
  nombre: string;
  email: string;
  age: number;
  telefono: number | null;
}

export async function GET(request: NextRequest) {
  const dni = request.nextUrl.searchParams.get('dni')?.trim() ?? '';
  const email = request.nextUrl.searchParams.get('email')?.trim() ?? '';

  if (!dni && !email) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Debe enviar dni o email.',
      },
      { status: 400 },
    );
  }

  if (dni && !/^\d+$/.test(dni)) {
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
    const whereClause = dni ? 'dni = $1' : 'email = $1';
    const lookupValue = dni || email;
    const result = await pool.query<PatientLookupRow>(
      `SELECT dni, apellido, nombre, email, age, telefono FROM "Patients" WHERE ${whereClause} LIMIT 1`,
      [lookupValue],
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
        dni: patient.dni,
        apellido: patient.apellido,
        nombre: patient.nombre,
        email: patient.email,
        edad: String(patient.age),
        telefono: patient.telefono !== null ? String(patient.telefono) : '',
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
