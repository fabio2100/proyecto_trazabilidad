import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: rawEmail, name, password, perfilId } = body as {
      email?: string;
      name?: string;
      password?: string;
      perfilId?: number;
    };

    if (!rawEmail || !password || !perfilId) {
      return NextResponse.json(
        { success: false, message: 'Email, contraseña y perfil son requeridos.' },
        { status: 400 },
      );
    }

    const email = rawEmail.trim().toLowerCase();

    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Email inválido.' },
        { status: 400 },
      );
    }

    const pool = getPool();

    const existingUser = await pool.query<{ id: string }>(
      'SELECT id FROM "Users" WHERE email = $1',
      [email],
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Usuario ya existe.' },
        { status: 409 },
      );
    }

    const useEncryption = process.env.PASSWORD_ENCRYPT === '1';
    const hashedPassword = useEncryption ? await bcrypt.hash(password, 10) : password;

    const userId = randomUUID();
    await pool.query(
      `INSERT INTO "Users" (id, email, name, password, validated, "createdAt", "perfilId")
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, $5)`,
      [userId, email, name?.trim() || null, hashedPassword, perfilId],
    );

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente.' }, { status: 201 });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error al crear usuario. Intenta más tarde.' },
      { status: 500 },
    );
  }
}
