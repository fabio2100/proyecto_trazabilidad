import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

interface PerfilRow {
  id: number;
  tipo: string;
}

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query<PerfilRow>('SELECT id, tipo FROM "Perfiles" ORDER BY id');
    return NextResponse.json({ perfiles: result.rows });
  } catch {
    return NextResponse.json({ error: 'Error al obtener perfiles.' }, { status: 500 });
  }
}
