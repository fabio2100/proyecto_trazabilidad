import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'No autenticado.' }, { status: 401 });
  }

  let userId: string;
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 401 });
  }

  let body: { name?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Cuerpo de solicitud inválido.' }, { status: 400 });
  }

  const { name, password } = body;

  if (!name && !password) {
    return NextResponse.json(
      { success: false, message: 'Debe proporcionar al menos un campo para actualizar.' },
      { status: 400 },
    );
  }

  const trimmedName = name?.trim();
  if (trimmedName !== undefined && trimmedName.length === 0) {
    return NextResponse.json({ success: false, message: 'El nombre no puede estar vacío.' }, { status: 400 });
  }

  if (password !== undefined && password.length < 6) {
    return NextResponse.json(
      { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' },
      { status: 400 },
    );
  }

  const pool = getPool();
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (trimmedName) {
    fields.push(`name = $${idx++}`);
    values.push(trimmedName);
  }

  if (password) {
    const useEncryption = process.env.PASSWORD_ENCRYPT === '1';
    const hashed = useEncryption ? await bcrypt.hash(password, 10) : password;
    fields.push(`password = $${idx++}`);
    values.push(hashed);
  }

  values.push(userId);

  await pool.query(
    `UPDATE "Users" SET ${fields.join(', ')} WHERE id = $${idx}`,
    values,
  );

  return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente.' });
}
