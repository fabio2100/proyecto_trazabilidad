import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires';

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
  estudioPrevioFecha?: string;
}

interface PatientRow {
  nombre: string;
  apellido: string;
  age: number;
  email: string;
  telefono: string | null;
}

interface YearAndMonth {
  year: number;
  month: number;
}

function normalizeYesNo(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Obtiene la fecha calendario actual en Argentina con formato YYYY-MM-DD.
 */
function getBusinessDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('No se pudo determinar la fecha de negocio.');
  }

  return `${year}-${month}-${day}`;
}

/**
 * Obtiene año y mes actuales según la zona horaria de Argentina.
 */
function getBusinessYearAndMonth(date = new Date()): YearAndMonth {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);

  const year = Number(
    parts.find((part) => part.type === 'year')?.value,
  );

  const month = Number(
    parts.find((part) => part.type === 'month')?.value,
  );

  if (!Number.isInteger(year) || year <= 0) {
    throw new Error(
      'No se pudo determinar el año de negocio para el sampleCode.',
    );
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(
      'No se pudo determinar el mes de negocio para el sampleCode.',
    );
  }

  return { year, month };
}

/**
 * Extrae el año y el mes de una fecha calendario YYYY-MM-DD.
 *
 * Debe invocarse después de validar la fecha con isValidCalendarDate().
 */
function getYearAndMonthFromCalendarDate(value: string): YearAndMonth {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(
      'No se pudo obtener el año y el mes del estudio previo.',
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || year <= 0) {
    throw new Error(
      'El año del estudio previo no es válido para el sampleCode.',
    );
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(
      'El mes del estudio previo no es válido para el sampleCode.',
    );
  }

  return { year, month };
}

/**
 * Verifica que el valor sea una fecha calendario real en formato YYYY-MM-DD.
 *
 * Evita aceptar valores como 2026-02-31.
 */
function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
}

/**
 * Convierte YYYY-MM-DD al comienzo de ese día en Argentina.
 *
 * Argentina utiliza UTC-03:00, por lo que el valor se guarda como un instante
 * equivalente a las 00:00 del día seleccionado en Buenos Aires.
 */
function toArgentinaMidnightDate(value: string): Date {
  return new Date(`${value}T00:00:00-03:00`);
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
    estudioPrevioFecha,
  } = body;

  if (
    !dni ||
    !nombre ||
    !apellido ||
    !edad ||
    !email ||
    !material ||
    !profesionalSolicitante ||
    !biopsiasPrevias
  ) {
    return NextResponse.json(
      { ok: false, message: 'Faltan campos obligatorios.' },
      { status: 400 },
    );
  }

  const age = Number.parseInt(edad, 10);

  if (!Number.isInteger(age) || age <= 0) {
    return NextResponse.json(
      { ok: false, message: 'La edad debe ser un número válido.' },
      { status: 400 },
    );
  }

  const normalizedBiopsiasPrevias = normalizeYesNo(biopsiasPrevias);

  if (
    normalizedBiopsiasPrevias !== 'si' &&
    normalizedBiopsiasPrevias !== 'no'
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Debe indicar si existe un estudio previo.',
      },
      { status: 400 },
    );
  }

  const biopsiasPreviasBool = normalizedBiopsiasPrevias === 'si';
  const normalizedEstudioPrevioFecha =
    estudioPrevioFecha?.trim() ?? '';

  let estudioPrevioFechaValue: Date | null = null;
  let sampleCodeYearAndMonth: YearAndMonth;

  if (biopsiasPreviasBool) {
    if (!normalizedEstudioPrevioFecha) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Debe seleccionar la fecha del estudio previo.',
        },
        { status: 400 },
      );
    }

    if (!isValidCalendarDate(normalizedEstudioPrevioFecha)) {
      return NextResponse.json(
        {
          ok: false,
          message: 'La fecha del estudio previo no es válida.',
        },
        { status: 400 },
      );
    }

    const todayArgentina = getBusinessDateString();

    /*
     * Las cadenas YYYY-MM-DD conservan el orden cronológico al compararlas.
     * De esta forma evitamos errores por UTC o por la hora del servidor.
     */
    if (normalizedEstudioPrevioFecha >= todayArgentina) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'La fecha del estudio previo debe ser anterior a la fecha actual.',
        },
        { status: 400 },
      );
    }

    estudioPrevioFechaValue = toArgentinaMidnightDate(
      normalizedEstudioPrevioFecha,
    );

    if (Number.isNaN(estudioPrevioFechaValue.getTime())) {
      return NextResponse.json(
        {
          ok: false,
          message: 'La fecha del estudio previo no es válida.',
        },
        { status: 400 },
      );
    }

    /*
     * Para un estudio previo, el año y el mes del código se obtienen de la
     * fecha histórica seleccionada. Por ejemplo, 2020-03-15 genera un código
     * perteneciente a la secuencia LHE-20-03-NNNN.
     */
    sampleCodeYearAndMonth = getYearAndMonthFromCalendarDate(
      normalizedEstudioPrevioFecha,
    );
  } else {
    /*
     * Para un estudio nuevo, el año y el mes se obtienen de la fecha actual
     * del laboratorio en la zona horaria de Argentina.
     */
    sampleCodeYearAndMonth = getBusinessYearAndMonth();
  }

  /*
   * Cuando se selecciona "No", estudioPrevioFechaValue permanece en null,
   * aunque el cliente haya enviado accidentalmente una fecha.
   */

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Manejo de la tabla Patients: upsert manual.
    const patientResult = await client.query<PatientRow>(
      `SELECT nombre, apellido, age, email, telefono
       FROM "Patients"
       WHERE dni = $1`,
      [dni],
    );

    const existing = patientResult.rows[0] ?? null;
    const telefonoValue = telefono?.trim() || null;

    if (!existing) {
      await client.query(
        `INSERT INTO "Patients"
         (dni, nombre, apellido, age, email, telefono)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          dni,
          nombre,
          apellido,
          age,
          email,
          telefonoValue,
        ],
      );
    } else {
      const changed =
        existing.nombre !== nombre ||
        existing.apellido !== apellido ||
        existing.age !== age ||
        existing.email !== email ||
        (existing.telefono ?? null) !==
          (telefonoValue ?? null);

      if (changed) {
        await client.query(
          `UPDATE "Patients"
           SET nombre = $2,
               apellido = $3,
               age = $4,
               email = $5,
               telefono = $6
           WHERE dni = $1`,
          [
            dni,
            nombre,
            apellido,
            age,
            email,
            telefonoValue,
          ],
        );
      }
    }

    // 2. Generar el código de muestra atómico por año y mes.
    const { year, month } = sampleCodeYearAndMonth;
    const shortYear = String(year).slice(-2);

    const sequenceResult = await client.query<{
      sequenceNumber: number;
    }>(
      `INSERT INTO "DiagnosisSequence"
         ("year", "month", "lastValue")
       VALUES ($1, $2, 0)
       ON CONFLICT ("year", "month")
       DO UPDATE
       SET "lastValue" =
         "DiagnosisSequence"."lastValue" + 1
       RETURNING "lastValue" AS "sequenceNumber"`,
      [year, month],
    );

    const sequenceNumber = Number(
      sequenceResult.rows[0]?.sequenceNumber,
    );

    if (
      !Number.isInteger(sequenceNumber) ||
      sequenceNumber < 0 ||
      sequenceNumber > 9999
    ) {
      throw new Error(
        'Se alcanzó o no se pudo obtener la secuencia mensual de diagnósticos.',
      );
    }

    const formattedMonth = String(month).padStart(2, '0');
    const formattedSequence = String(sequenceNumber).padStart(
      4,
      '0',
    );

    const sampleCode =
      `LHE-${shortYear}-${formattedMonth}-${formattedSequence}`;

    // 3. Insertar el nuevo diagnóstico.
    const diagnosisId = randomUUID();

    await client.query(
      `INSERT INTO "Diagnosis"
       (
         id,
         "sampleCode",
         "patientId",
         diagnosis,
         material,
         "profesionalSolicitante",
         "biopsasPrevias",
         "estudioPrevioFecha"
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        diagnosisId,
        sampleCode,
        dni,
        diagnostico ?? '',
        material,
        profesionalSolicitante,
        biopsiasPreviasBool,
        estudioPrevioFechaValue,
      ],
    );

    await client.query('COMMIT');

    return NextResponse.json({
      ok: true,
      message:
        'Paciente y diagnóstico guardados correctamente.',
      diagnosisId,
      sampleCode,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[guardar_paciente] Error:', error);

    return NextResponse.json(
      {
        ok: false,
        message:
          'No se pudo guardar el paciente. Intente nuevamente.',
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}