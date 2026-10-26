import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { getPool } from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InformePdfBody {
  idInforme?: string;
  diagnosisId?: string;
  onlyDiagnosis?: boolean;
}

interface InformeJoinRow {
  informeId: string | null;
  informeCuerpo: string | null;
  informeMicroscopia: string | null;
  informeMacroscopia: string | null;
  informeCreatedAt: Date | null;
  informeUserId: string | null;
  informeCreatorName: string | null;
  diagnosisId: string;
  diagnosisCreatorName: string | null;
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

async function toPdfBuffer(data: InformeJoinRow, onlyDiagnosis = false) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(onlyDiagnosis ? `Diagnostico ${data.diagnosisId}` : `Informe ${data.informeId ?? ''}`);

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
    page.drawText(text, {
      x: left,
      y,
      size,
      font: bold ? fontBold : fontRegular,
    });
    y -= size + 6;
  };

  const drawCenteredLine = (text: string, size = 11, bold = false) => {
    ensureSpace(size + 10);
    const font = bold ? fontBold : fontRegular;
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = left + (contentWidth - textWidth) / 2;
    page.drawText(text, {
      x,
      y,
      size,
      font,
    });
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

  const tryReadImageBytes = async (url: string): Promise<Buffer | null> => {
    try {
      if (url.startsWith('/')) {
        const filePath = path.join(process.cwd(), 'public', url.replace(/^\//, ''));
        return await readFile(filePath);
      }

      if (url.startsWith('http://') || url.startsWith('https://')) {
        const res = await fetch(url);
        if (!res.ok) return null;
        const arr = await res.arrayBuffer();
        return Buffer.from(arr);
      }

      return null;
    } catch {
      return null;
    }
  };

  const drawImageFromUrl = async (url: string) => {
    const lowerUrl = url.toLowerCase();
    const isPng = lowerUrl.endsWith('.png');
    const isJpg =
      lowerUrl.endsWith('.jpg') ||
      lowerUrl.endsWith('.jpeg');

    if (!isPng && !isJpg) {
      drawLine(`Imagen no embebible en PDF (solo JPG/PNG): ${url}`);
      return;
    }

    const bytes = await tryReadImageBytes(url);
    if (!bytes) {
      drawLine(`No se pudo cargar imagen: ${url}`);
      return;
    }

    try {
      const image = isPng
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);

      const scale = Math.min(
        contentWidth / image.width,
        220 / image.height,
      );
      const width = image.width * scale;
      const height = image.height * scale;

      ensureSpace(height + 20);
      page.drawImage(image, {
        x: left,
        y: y - height,
        width,
        height,
      });
      y -= height + 8;
      drawLine(`Imagen: ${url}`, 9, false);
    } catch {
      drawLine(`No se pudo procesar imagen: ${url}`);
    }
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

  if (onlyDiagnosis && data.notasTecnicoId) {
    drawLine('Informacion de notas del tecnico', 14, true);
    drawLine(`ID nota: ${data.notasTecnicoId}`);
    drawLine(`Creado por: ${data.notasTecnicoCreatorName ?? 'No disponible'}`);
    drawLine(
      `Fecha nota: ${data.notasTecnicoCreatedAt ? new Date(data.notasTecnicoCreatedAt).toLocaleString() : 'No disponible'}`,
    );
    drawLine('Cuerpo nota:', 11, true);
    drawParagraph(data.notasTecnicoCuerpo || '');

    drawLine('Imagenes de la nota:', 11, true);
    if (!data.notasTecnicoImagenes || data.notasTecnicoImagenes.length === 0) {
      drawLine('Sin imagenes adjuntas.');
    } else {
      for (const imageUrl of data.notasTecnicoImagenes) {
        await drawImageFromUrl(imageUrl);
      }
    }
    y -= 8;
  }

  if (!onlyDiagnosis) {
    drawHorizontalRule(6, 16);
    if (!data.informeId) {
      drawLine('Sin informe cargado.');
    } else {
      drawLine(`Fecha del informe: ${formatDateOnly(data.informeCreatedAt)}`);
      drawLine(`Creado por: ${data.informeCreatorName ?? 'No disponible'}`);
      y -= 2;
      drawLine('Microscopía:', 13, true);
      drawParagraph(data.informeMicroscopia || '');
      y -= 2;
      drawLine('Macroscopía:', 13, true);
      drawParagraph(data.informeMacroscopia || '');
      y -= 2;
      drawLine('Diagnóstico:', 13, true);
      drawParagraph(data.informeCuerpo || '');
    }
  }

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
  const diagnosisId = body.diagnosisId?.trim() ?? '';
  const onlyDiagnosis = !!body.onlyDiagnosis;

  if (!idInforme && !diagnosisId) {
    return NextResponse.json(
      { ok: false, message: 'Se debe especificar idInforme o diagnosisId.' },
      { status: 400 },
    );
  }

  try {
    const pool = getPool();
    let query = '';
    let queryParam = '';

    if (idInforme) {
      query = `
        SELECT
          i.id AS "informeId",
          i.diagnostico AS "informeCuerpo",
          i.microscopia AS "informeMicroscopia",
          i.macroscopia AS "informeMacroscopia",
          i."createdAt" AS "informeCreatedAt",
          i."userId" AS "informeUserId",
          ui.name AS "informeCreatorName",
          d.id AS "diagnosisId",
          u.name AS "diagnosisCreatorName",
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
        LEFT JOIN "Users" u ON u.id = d."userId"
        LEFT JOIN "NotasDelTecnico" n ON n."diagnosisId" = d.id
        LEFT JOIN "Users" un ON un.id = n."userId"
        LEFT JOIN "Users" ui ON ui.id = i."userId"
        INNER JOIN "Patients" p ON p.dni = d."patientId"
        WHERE i.id = $1
        LIMIT 1
      `;
      queryParam = idInforme;
    } else {
      query = `
        SELECT
          i.id AS "informeId",
          i.diagnostico AS "informeCuerpo",
          i.microscopia AS "informeMicroscopia",
          i.macroscopia AS "informeMacroscopia",
          i."createdAt" AS "informeCreatedAt",
          i."userId" AS "informeUserId",
          ui.name AS "informeCreatorName",
          d.id AS "diagnosisId",
          u.name AS "diagnosisCreatorName",
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
        FROM "Diagnosis" d
        LEFT JOIN "Users" u ON u.id = d."userId"
        INNER JOIN "Patients" p ON p.dni = d."patientId"
        LEFT JOIN "Informes" i ON i."diagnosisId" = d.id
        LEFT JOIN "Users" ui ON ui.id = i."userId"
        LEFT JOIN "NotasDelTecnico" n ON n."diagnosisId" = d.id
        LEFT JOIN "Users" un ON un.id = n."userId"
        WHERE d.id = $1
        LIMIT 1
      `;
      queryParam = diagnosisId;
    }

    const result = await pool.query<InformeJoinRow>(query, [queryParam]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, message: idInforme ? 'Informe no encontrado.' : 'Diagnóstico no encontrado.' },
        { status: 404 },
      );
    }

    const pdfBuffer = await toPdfBuffer(result.rows[0], onlyDiagnosis);
    const filename = onlyDiagnosis
      ? `diagnostico-${result.rows[0].diagnosisId}.pdf`
      : `informe-${idInforme}.pdf`;

    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[informePdf] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo generar el PDF.' },
      { status: 500 },
    );
  }
}