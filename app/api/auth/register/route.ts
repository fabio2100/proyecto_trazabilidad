import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: rawEmail, password, name } = body as {
      email?: string;
      password?: string;
      name?: string;
    };

    // Validar que email y password estén presentes
    if (!rawEmail || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son requeridos.' },
        { status: 400 },
      );
    }

    // Normalizar email
    const email = rawEmail.trim().toLowerCase();

    // Validar formato básico de email
    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Email inválido.' },
        { status: 400 },
      );
    }

    const pool = getPool();

    // Verificar si ya existe un usuario con ese email
    const existingUser = await pool.query<{ id: string }>(
      'SELECT id FROM "Users" WHERE email = $1',
      [email],
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'El email ya está registrado.' },
        { status: 409 },
      );
    }

    // Preparar password: hashear si PASSWORD_ENCRYPT=1, sino guardar en plano
    const useEncryption = process.env.PASSWORD_ENCRYPT === '1';
    const hashedPassword = useEncryption ? await bcrypt.hash(password, 10) : password;

    // Crear nuevo usuario
    const userId = randomUUID();
    const result = await pool.query<UserRow>(
      `INSERT INTO "Users" (id, email, name, password, validated, "createdAt") 
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
       RETURNING id, email, name`,
      [userId, email, name || null, hashedPassword],
    );

    const newUser = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario registrado exitosamente.',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { success: false, message: 'Error al registrar usuario. Intenta más tarde.' },
      { status: 500 },
    );
  }
}
