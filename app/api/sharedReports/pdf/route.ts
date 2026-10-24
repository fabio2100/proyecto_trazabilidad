import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SharedPdfBody {
  token?: string;
  informeId?: string;
}

interface InformeJoinRow {
  informeId: string;
  informeCuerpo: string;
  informeCreatedAt: Date;
  informeUserId: string;
  informeCreatorName: string | null;
  diagnosisId: string;
  diagnosis: string;
  material: string;
  profesionalSolicitante: string;
  biopsasPrevias: boolean;
  diagnosisCreatedAt: Date;
  notasTecnicoId: string | null;
  notasTecnicoCuerpo: string | null;
  notasTecnicoImagenes: string[];
  notasTecnicoCreatedAt: Date | null;
  notasTecnicoUserId: string | null;
  notasTecnicoCreatorName: string | null;
  patientDni: string;
  patientNombre: string;
  patientApellido: string;
  patientEmail: string;
  patientFechaNacimiento: string | null;
  patientTelefono: string | null;
}

async function toPdfBuffer(data: InformeJoinRow): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Informe ${data.informeId}`);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = page.getHeight() - 50;
  const left = 50;
  const contentWidth = page.getWidth() - 100;

  const ensureSpace = (requiredHeight: number) => {
    if (y - requiredHeight < 40) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = page.getHeight() - 50;
    }
  };

  const drawLine = (text: string, size = 11, bold = false) => {
    ensureSpace(size + 10);
    page.drawText(text, { x: left, y, size, font: bold ? fontBold : fontRegular });
    y -= size + 6;
  };

  const drawParagraph = (text: string, size = 11) => {
    const words = text.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word;
      if (fontRegular.widthOfTextAtSize(nextLine, size) > contentWidth && line) {
        drawLine(line, size, false);
        line = word;
      } else {
        line = nextLine;
      }
    }
    if (line) drawLine(line, size, false);
  };

  drawLine('Informe Medico', 20, true);
  y -= 8;
  drawLine('Informacion de paciente', 14, true);
  drawLine(`DNI: ${data.patientDni}`);
  drawLine(`Nombre: ${data.patientNombre} ${data.patientApellido}`);
  drawLine(`Email: ${data.patientEmail}`);
  drawLine(`Fecha de nacimiento: ${data.patientFechaNacimiento ?? 'Sin dato'}`);
  drawLine(`Telefono: ${data.patientTelefono ?? 'Sin dato'}`);
  y -= 8;
  drawLine('Informacion de diagnostico', 14, true);
  drawLine(`ID diagnostico: ${data.diagnosisId}`);
  drawLine(`Diagnostico: ${data.diagnosis}`);
  drawLine(`Material: ${data.material}`);
  drawLine(`Profesional solicitante: ${data.profesionalSolicitante}`);
  drawLine(`Biopsias previas: ${data.biopsasPrevias ? 'Si' : 'No'}`);
  drawLine(`Fecha diagnostico: ${new Date(data.diagnosisCreatedAt).toLocaleString()}`);
  y -= 8;

  drawLine('Informacion de informe', 14, true);
  drawLine(`ID informe: ${data.informeId}`);
  drawLine(`Usuario informe (ID): ${data.informeUserId}`);
  drawLine(`Usuario informe (Nombre): ${data.informeCreatorName ?? 'No disponible'}`);
  drawLine(`Fecha informe: ${new Date(data.informeCreatedAt).toLocaleString()}`);
  drawLine('Cuerpo:', 11, true);
  drawParagraph(data.informeCuerpo);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function POST(request: NextRequest) {
  let body: SharedPdfBody;

  try {
    body = (await request.json()) as SharedPdfBody;
  } catch {
    return NextResponse.json({ ok: false, message: 'Cuerpo de solicitud inválido.' }, { status: 400 });
  }

  const token = body.token?.trim() ?? '';
  const informeId = body.informeId?.trim() ?? '';

  if (!token || !informeId) {
    return NextResponse.json(
      { ok: false, message: 'Los campos token e informeId son obligatorios.' },
      { status: 400 },
    );
  }

  const pool = getPool();

  // Verify the share token is still valid and maps to the requested informe
  const linkResult = await pool.query<{ informeId: string; expiresAt: Date }>(
    'SELECT "informeId", "expiresAt" FROM "SharedReportLink" WHERE token = $1',
    [token],
  );

  const link = linkResult.rows[0];

  if (!link) {
    return NextResponse.json({ ok: false, message: 'Link no encontrado.' }, { status: 404 });
  }

  if (link.expiresAt <= new Date()) {
    return NextResponse.json({ ok: false, message: 'El link ha expirado.' }, { status: 410 });
  }

  if (link.informeId !== informeId) {
    return NextResponse.json({ ok: false, message: 'Acceso no autorizado.' }, { status: 403 });
  }

  try {
    const result = await pool.query<InformeJoinRow>(
      `SELECT
         i.id AS "informeId",
         i.cuerpo AS "informeCuerpo",
         i."createdAt" AS "informeCreatedAt",
         i."userId" AS "informeUserId",
         ui.name AS "informeCreatorName",
         d.id AS "diagnosisId",
         d.diagnosis,
         d.material,
         d."profesionalSolicitante",
         d."biopsasPrevias",
         d."createdAt" AS "diagnosisCreatedAt",
         n.id AS "notasTecnicoId",
         n.cuerpo AS "notasTecnicoCuerpo",
         COALESCE(n.imagenes, ARRAY[]::TEXT[]) AS "notasTecnicoImagenes",
         n."createdAt" AS "notasTecnicoCreatedAt",
         n."userId" AS "notasTecnicoUserId",
         un.name AS "notasTecnicoCreatorName",
         p.dni AS "patientDni",
         p.nombre AS "patientNombre",
         p.apellido AS "patientApellido",
         p.email AS "patientEmail",
         TO_CHAR(p."fechaNacimiento", 'YYYY-MM-DD') AS "patientFechaNacimiento",
         p.telefono AS "patientTelefono"
       FROM "Informes" i
       INNER JOIN "Diagnosis" d ON d.id = i."diagnosisId"
       LEFT JOIN "Users" ui ON ui.id = i."userId"
       LEFT JOIN "NotasDelTecnico" n ON n."diagnosisId" = d.id
       LEFT JOIN "Users" un ON un.id = n."userId"
       INNER JOIN "Patients" p ON p.dni = d."patientId"
       WHERE i.id = $1
       LIMIT 1`,
      [informeId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, message: 'Informe no encontrado.' }, { status: 404 });
    }

    const pdfBuffer = await toPdfBuffer(result.rows[0]);

    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe-${informeId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[sharedReports/pdf] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo generar el PDF del informe.' },
      { status: 500 },
    );
  }
}
