import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { verifyToken } from '@/lib/jwt';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

const SUPERUSUARIO_PERFIL_ID = 4;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  validated: boolean;
  createdAt: Date;
  perfilId: number;
  perfilTipo: string;
}

async function requireSuperusuario(request: NextRequest): Promise<string | NextResponse> {
  const token = request.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ success: false, message: 'No autenticado.' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const pool = getPool();
    const result = await pool.query<{ perfilId: number }>(
      'SELECT "perfilId" FROM "Users" WHERE id = $1',
      [payload.userId],
    );
    const user = result.rows[0];
    if (!user || user.perfilId !== SUPERUSUARIO_PERFIL_ID) {
      return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 403 });
    }
    return payload.userId;
  } catch {
    return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireSuperusuario(request);
  if (authResult instanceof NextResponse) return authResult;

  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const rawOffset = Number(request.nextUrl.searchParams.get('offset') ?? 0);
  const search = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limit = Number.isInteger(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  const pool = getPool();
  const values: Array<string | number> = [SUPERUSUARIO_PERFIL_ID];
  let whereClause = 'WHERE u."perfilId" != $1';

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    const searchParam = `$${values.length}`;
    whereClause += `
      AND (
        LOWER(COALESCE(u.name, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(u.email, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(p.tipo, '')) LIKE ${searchParam}
        OR LOWER(CASE WHEN u.validated THEN 'sí' ELSE 'no' END) LIKE ${searchParam}
      )`;
  }

  values.push(limit + 1, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;
  const result = await pool.query<UserRow>(`
    SELECT u.id, u.email, u.name, u.validated, u."createdAt", u."perfilId", p.tipo AS "perfilTipo"
    FROM "Users" u
    JOIN "Perfiles" p ON p.id = u."perfilId"
    ${whereClause}
    ORDER BY u."createdAt" DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `, values);

  const hasMore = result.rows.length > limit;
  const users = hasMore ? result.rows.slice(0, limit) : result.rows;

  return NextResponse.json({ users, hasMore });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSuperusuario(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: { email?: string; name?: string; password?: string; perfilId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Cuerpo inválido.' }, { status: 400 });
  }

  const { email: rawEmail, name, password, perfilId } = body;

  if (!rawEmail || !password || !perfilId) {
    return NextResponse.json(
      { success: false, message: 'Email, contraseña y perfil son requeridos.' },
      { status: 400 },
    );
  }

  if (perfilId === SUPERUSUARIO_PERFIL_ID) {
    return NextResponse.json(
      { success: false, message: 'No se puede asignar el perfil superusuario.' },
      { status: 400 },
    );
  }

  const email = rawEmail.trim().toLowerCase();
  if (!email.includes('@')) {
    return NextResponse.json({ success: false, message: 'Email inválido.' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' },
      { status: 400 },
    );
  }

  const pool = getPool();
  const existing = await pool.query<{ id: string }>('SELECT id FROM "Users" WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ success: false, message: 'El email ya está en uso.' }, { status: 409 });
  }

  const useEncryption = process.env.PASSWORD_ENCRYPT === '1';
  const hashedPassword = useEncryption ? await bcrypt.hash(password, 10) : password;

  const id = randomUUID();
  await pool.query(
    'INSERT INTO "Users" (id, email, name, password, "perfilId") VALUES ($1, $2, $3, $4, $5)',
    [id, email, name?.trim() || null, hashedPassword, perfilId],
  );

  return NextResponse.json({ success: true, message: 'Usuario creado correctamente.', id }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireSuperusuario(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: { id?: string; name?: string; password?: string; perfilId?: number; validated?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Cuerpo inválido.' }, { status: 400 });
  }

  const { id, name, password, perfilId, validated } = body;

  if (!id) {
    return NextResponse.json({ success: false, message: 'ID de usuario requerido.' }, { status: 400 });
  }

  if (perfilId === SUPERUSUARIO_PERFIL_ID) {
    return NextResponse.json(
      { success: false, message: 'No se puede asignar el perfil superusuario.' },
      { status: 400 },
    );
  }

  if (password !== undefined && password.length < 6) {
    return NextResponse.json(
      { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' },
      { status: 400 },
    );
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name.trim() || null);
  }
  if (password) {
    const useEncryption = process.env.PASSWORD_ENCRYPT === '1';
    const hashed = useEncryption ? await bcrypt.hash(password, 10) : password;
    fields.push(`password = $${idx++}`);
    values.push(hashed);
  }
  if (perfilId !== undefined) {
    fields.push(`"perfilId" = $${idx++}`);
    values.push(perfilId);
  }
  if (validated !== undefined) {
    fields.push(`validated = $${idx++}`);
    values.push(validated);
  }

  if (fields.length === 0) {
    return NextResponse.json({ success: false, message: 'Sin campos para actualizar.' }, { status: 400 });
  }

  values.push(id);
  const pool = getPool();
  const result = await pool.query(
    `UPDATE "Users" SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id`,
    values,
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ success: false, message: 'Usuario no encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente.' });
}
