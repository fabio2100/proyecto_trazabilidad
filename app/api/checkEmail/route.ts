import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ exists: false });
  }

  try {
    const pool = getPool();
    const result = await pool.query<{ id: string }>(
      'SELECT id FROM "Users" WHERE email = $1',
      [email],
    );

    return NextResponse.json({ exists: result.rows.length > 0 });
  } catch {
    return NextResponse.json({ error: 'Error al verificar email.' }, { status: 500 });
  }
}
