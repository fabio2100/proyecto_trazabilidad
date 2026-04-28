import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InformePdfBody {
  idInforme: string;
}

interface InformeJoinRow {
  informeId: string;
  informeCuerpo: string;
  informeCreatedAt: Date;
  diagnosisId: string;
  diagnosis: string;
  material: string;
  profesionalSolicitante: string;
  biopsasPrevias: boolean;
  diagnosisCreatedAt: Date;
  patientDni: string;
  patientNombre: string;
  patientApellido: string;
  patientEmail: string;
  patientAge: number;
  patientTelefono: string | null;
}

async function toPdfBuffer(data: InformeJoinRow) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Informe ${data.informeId}`);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = page.getHeight() - 50;
  const left = 50;
  const contentWidth = page.getWidth() - 100;

  const drawLine = (text: string, size = 11, bold = false) => {
    page.drawText(text, {
      x: left,
      y,
      size,
      font: bold ? fontBold : fontRegular,
    });
    y -= size + 6;
  };

  const drawParagraph = (text: string, size = 11) => {
    const words = text.split(/\s+/).filter(Boolean);
    let line = '';

    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word;
      const nextWidth = fontRegular.widthOfTextAtSize(nextLine, size);

      if (nextWidth > contentWidth && line) {
        drawLine(line, size, false);
        line = word;
      } else {
        line = nextLine;
      }
    }

    if (line) {
      drawLine(line, size, false);
    }
  };

  drawLine('Informe Medico', 20, true);
  y -= 8;

  drawLine('Informacion de paciente', 14, true);
  drawLine(`DNI: ${data.patientDni}`);
  drawLine(`Nombre: ${data.patientNombre} ${data.patientApellido}`);
  drawLine(`Email: ${data.patientEmail}`);
  drawLine(`Edad: ${data.patientAge}`);
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
  drawLine(`Fecha informe: ${new Date(data.informeCreatedAt).toLocaleString()}`);
  drawLine('Cuerpo:', 11, true);
  drawParagraph(data.informeCuerpo);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function POST(request: NextRequest) {
  let body: InformePdfBody;

  try {
    body = (await request.json()) as InformePdfBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Cuerpo de solicitud invalido.' },
      { status: 400 },
    );
  }

  const idInforme = body.idInforme?.trim() ?? '';

  if (!idInforme) {
    return NextResponse.json(
      { ok: false, message: 'El campo idInforme es obligatorio.' },
      { status: 400 },
    );
  }

  try {
    const pool = getPool();
    const result = await pool.query<InformeJoinRow>(
      `SELECT
         i.id AS "informeId",
         i.cuerpo AS "informeCuerpo",
         i."createdAt" AS "informeCreatedAt",
         d.id AS "diagnosisId",
         d.diagnosis,
         d.material,
         d."profesionalSolicitante",
         d."biopsasPrevias",
         d."createdAt" AS "diagnosisCreatedAt",
         p.dni AS "patientDni",
         p.nombre AS "patientNombre",
         p.apellido AS "patientApellido",
         p.email AS "patientEmail",
         p.age AS "patientAge",
         p.telefono AS "patientTelefono"
       FROM "Informes" i
       INNER JOIN "Diagnosis" d ON d.id = i."diagnosisId"
       INNER JOIN "Patients" p ON p.dni = d."patientId"
       WHERE i.id = $1
       LIMIT 1`,
      [idInforme],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Informe no encontrado.' },
        { status: 404 },
      );
    }

    const pdfBuffer = await toPdfBuffer(result.rows[0]);

    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe-${idInforme}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[informePdf] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo generar el PDF del informe.' },
      { status: 500 },
    );
  }
}