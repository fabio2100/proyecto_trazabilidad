import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

interface UserRow {
  id: string;
  perfilId: number;
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
    'SELECT id, "perfilId" FROM "Users" WHERE id = $1',
    [userId],
  );

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, userId, perfilId: user.perfilId });
}
