import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

const ERROR_MESSAGE = 'Credenciales incorrectas. Por favor verifique su email y contraseña.';

interface UserRow {
  id: string;
  password: string;
  validated: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: ERROR_MESSAGE }, { status: 401 });
    }

    const pool = getPool();
    const result = await pool.query<UserRow>(
      'SELECT id, password, validated FROM "Users" WHERE email = $1',
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ ok: false, message: ERROR_MESSAGE }, { status: 401 });
    }

    if (!user.validated) {
      return NextResponse.json({ ok: false, message: ERROR_MESSAGE }, { status: 401 });
    }

    const useEncryption = process.env.PASSWORD_ENCRYPT === '1';
    const passwordMatch = useEncryption
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!passwordMatch) {
      return NextResponse.json({ ok: false, message: ERROR_MESSAGE }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: ERROR_MESSAGE }, { status: 500 });
  }
}
