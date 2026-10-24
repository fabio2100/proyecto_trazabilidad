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
  estudioPrevioFecha: Date | null;
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

function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return 'No disponible';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return date.toLocaleDateString('es-AR');
}

function calculateAgeAtStudy(
  birthDateRaw: string | null,
  studyDateRaw: Date | string | null | undefined,
) {
  if (!birthDateRaw || !studyDateRaw) return 'No disponible';

  const birthDate = new Date(`${birthDateRaw}T00:00:00`);
  const studyDate = studyDateRaw instanceof Date ? studyDateRaw : new Date(studyDateRaw);

  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(studyDate.getTime())) {
    return 'No disponible';
  }

  let age = studyDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = studyDate.getMonth() - birthDate.getMonth();
  const dayDiff = studyDate.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  if (age < 0) return 'No disponible';
  return `${age} años`;
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
  const right = left + contentWidth;

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

  const drawCenteredLine = (text: string, size = 11, bold = false) => {
    ensureSpace(size + 10);
    const font = bold ? fontBold : fontRegular;
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = left + (contentWidth - textWidth) / 2;
    page.drawText(text, { x, y, size, font });
    y -= size + 6;
  };

  const drawHorizontalRule = (spacingTop = 6, spacingBottom = 8) => {
    y -= spacingTop;
    ensureSpace(8);
    page.drawLine({
      start: { x: left, y },
      end: { x: right, y },
      thickness: 1,
    });
    y -= spacingBottom;
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

  const fechaEstudio = data.estudioPrevioFecha ?? data.diagnosisCreatedAt;

  drawHorizontalRule(0, 26);
  drawCenteredLine('INFORME HISTOPATOLOGICO', 18, true);
  drawHorizontalRule(4, 18);

  drawLine(`Nombre y apellido: ${data.patientNombre} ${data.patientApellido}`);
  drawLine(`DNI: ${data.patientDni}`);
  drawLine(`Email: ${data.patientEmail}`);
  drawLine(`Fecha de Nacimiento: ${formatDateOnly(data.patientFechaNacimiento)}`);
  drawLine(`Edad: ${calculateAgeAtStudy(data.patientFechaNacimiento, fechaEstudio)}`);
  drawLine(`Fecha de estudio: ${formatDateOnly(fechaEstudio)}`);
  drawLine(`Medico solicitante: ${data.profesionalSolicitante}`);
  drawLine(`Material: ${data.material}`);
  drawLine(`Biopsias previas: ${data.biopsasPrevias ? 'Si' : 'No'}`);
  drawLine(`Observaciones: ${data.diagnosis}`);
  y -= 4;

  drawHorizontalRule(6, 16);
  drawLine(`Fecha del informe: ${formatDateOnly(data.informeCreatedAt)}`);
  drawLine(`Creado por: ${data.informeCreatorName ?? 'No disponible'}`);
  y -= 2;
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
         d."estudioPrevioFecha",
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
