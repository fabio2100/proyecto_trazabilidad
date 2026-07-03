import { NextResponse } from 'next/server';

// The middleware handles token validation before this handler runs.
// If the request reaches here, the token is valid.
export async function GET() {
  return NextResponse.json({ ok: true });
}
