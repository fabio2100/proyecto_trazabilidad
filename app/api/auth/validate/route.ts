import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// The middleware validates the session cookie before this handler runs.
// If the request reaches here, the token is valid — just decode and return userId.
export async function GET(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { userId } = await verifyToken(token);
  return NextResponse.json({ ok: true, userId });
}
