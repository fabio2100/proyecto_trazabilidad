import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_EXPIRY = '8h';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está definido en las variables de entorno');
  return new TextEncoder().encode(secret);
}

export interface JwtUserPayload extends JWTPayload {
  userId: string;
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtUserPayload> {
  const { payload } = await jwtVerify<JwtUserPayload>(token, getSecret());
  return payload;
}

/** Decodifica el payload sin verificar firma (solo para uso cliente-side) */
export function decodeTokenPayload(token: string): JwtUserPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as JwtUserPayload;
    return payload;
  } catch {
    return null;
  }
}

/** Valida que el token no esté expirado (solo para uso cliente-side) */
export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return Date.now() / 1000 > payload.exp;
}
