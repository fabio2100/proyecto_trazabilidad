import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export async function POST(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.json({ ok: false, message: 'No autenticado.' }, { status: 401 });
  }

  let payload: { userId: string };
  try {
    payload = await verifyToken(token);
  } catch {
    return NextResponse.json({ ok: false, message: 'Token inválido.' }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'notas-tecnico';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Falta configuración de Supabase (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).',
        },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const formData = await request.formData();
    const fileValue = formData.get('file');

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ ok: false, message: 'No se recibió archivo.' }, { status: 400 });
    }

    const ext = MIME_TO_EXT[fileValue.type];
    if (!ext) {
      return NextResponse.json({ ok: false, message: 'Formato no soportado. Use JPG, PNG, WEBP o GIF.' }, { status: 400 });
    }

    if (fileValue.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ ok: false, message: 'La imagen supera el máximo de 5MB.' }, { status: 400 });
    }

    const filename = `${Date.now()}-${payload.userId}-${randomUUID()}${ext}`;
    const objectPath = `notas-tecnico/${payload.userId}/${filename}`;

    const arrayBuffer = await fileValue.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await supabase.storage
      .from(supabaseBucket)
      .upload(objectPath, buffer, {
        contentType: fileValue.type,
        upsert: false,
      });

    if (uploadResult.error) {
      console.error('[notas-tecnico-upload] Supabase upload error:', uploadResult.error);
      return NextResponse.json(
        { ok: false, message: 'No se pudo subir la imagen a Supabase Storage.' },
        { status: 500 },
      );
    }

    const { data: publicData } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(objectPath);

    const publicUrl = publicData.publicUrl;

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (error) {
    console.error('[notas-tecnico-upload] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo subir la imagen.' },
      { status: 500 },
    );
  }
}
