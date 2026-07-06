import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Rutas que NO requieren autenticación
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/consulta',
  '/api/auth/login',
  '/api/auth/register',
  '/api/sharedReports',
  '/_next',
  '/favicon.ico',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET no configurado');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Intentar obtener el token: primero de cookie HTTP-only, luego del header Authorization
  const cookieToken = request.cookies.get('session')?.value;
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = cookieToken ?? bearerToken;

  if (!token) {
    // Para rutas API devolver 401, para páginas redirigir a login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    // Token inválido o expirado
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, message: 'Token inválido o expirado' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas excepto archivos estáticos de Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
