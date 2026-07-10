import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/db';
import { signToken } from '@/lib/jwt';

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

    console.log('[login-debug] email recibido:', email);
    console.log('[login-debug] user encontrado:', !!user);
    console.log('[login-debug] user.email:', (user as any).email);
    console.log('[login-debug] user.validated:', user.validated);
    console.log('[login-debug] process.env.PASSWORD_ENCRYPT:', process.env.PASSWORD_ENCRYPT);
    console.log('[login-debug] useEncryption:', useEncryption);
    console.log('[login-debug] longitud password recibida:', password ? password.length : 0);
    console.log('[login-debug] longitud user.password:', user.password ? user.password.length : 0);
    if (!useEncryption) {
      console.log('[login-debug] comparación plana (password === user.password):', password === user.password);
    }

    const passwordMatch = useEncryption
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!passwordMatch) {
      return NextResponse.json({ ok: false, message: ERROR_MESSAGE }, { status: 401 });
    }

    const token = await signToken(user.id);

    const response = NextResponse.json({ ok: true, token });
    response.cookies.set('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 horas
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: ERROR_MESSAGE }, { status: 500 });
  }
}
