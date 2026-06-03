import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ValidateSharedReportBody {
  token?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateSharedReportBody;
    const token = body.token?.trim() ?? '';
    const password = body.password?.trim() ?? '';

    if (!token || !password) {
      return NextResponse.json(
        { ok: false, message: 'Token y contraseña son obligatorios.' },
        { status: 400 },
      );
    }

    const pool = getPool();
    const result = await pool.query<{
      token: string;
      password: string;
      informeId: string;
      expiresAt: Date;
    }>(
      'SELECT token, password, "informeId", "expiresAt" FROM "SharedReportLink" WHERE token = $1',
      [token],
    );

    const link = result.rows[0];

    if (!link) {
      return NextResponse.json(
        { ok: false, message: 'Link no encontrado.' },
        { status: 404 },
      );
    }

    const now = new Date();
    if (link.expiresAt <= now) {
      return NextResponse.json(
        { ok: false, message: 'El link ha expirado.' },
        { status: 410 },
      );
    }

    if (link.password !== password) {
      return NextResponse.json(
        { ok: false, message: 'Contraseña incorrecta.' },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      informeId: link.informeId,
      expiresAt: link.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[sharedReports/validate] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo validar el link. Intente nuevamente.' },
      { status: 500 },
    );
  }
}
