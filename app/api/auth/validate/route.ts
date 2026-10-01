import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

interface UserRow {
  id: string;
  name: string | null;
  perfilId: number;
  perfilTipo: string | null;
}

// The middleware validates the session cookie before this handler runs.
// If the request reaches here, the token is valid — just decode and return userId.
export async function GET(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { userId } = await verifyToken(token);

  const pool = getPool();
  const result = await pool.query<UserRow>(
    `SELECT u.id, u.name, u."perfilId", p.tipo AS "perfilTipo"
     FROM "Users" u
     LEFT JOIN "Perfiles" p ON p.id = u."perfilId"
     WHERE u.id = $1`,
    [userId],
  );

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    userId,
    userName: user.name,
    perfilId: user.perfilId,
    perfilTipo: user.perfilTipo,
  });
}
