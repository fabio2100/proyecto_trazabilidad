import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DiagnosisPdfBody {
  diagnosisId: string;
  qrTargetUrl: string;
  formData: {
    dni: string;
    nombre: string;
    apellido: string;
    edad: string;
    email: string;
    telefono?: string;
    material: string;
    profesionalSolicitante: string;
    obraSocialFamas: string;
    biopsiasPrevias: string;
    diagnostico: string;
  };
}

function getBase64FromDataUrl(dataUrl: string): string {
  const marker = 'base64,';
  const markerIndex = dataUrl.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error('No se pudo procesar la imagen QR.');
  }

  return dataUrl.slice(markerIndex + marker.length);
}

const MM = 72 / 25.4; // points per mm

async function toPdfBuffer(payload: DiagnosisPdfBody): Promise<Buffer> {
  // Layout: 50 x 30 mm (top row 20 mm + bottom row 10 mm)
  const PAGE_W = 50 * MM;
  const TOP_ROW_H = 20 * MM;
  const BOT_ROW_H = 10 * MM;
  const PAGE_H = TOP_ROW_H + BOT_ROW_H;
  const COL_W = PAGE_W / 2; // 25 mm each column

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Etiqueta ${payload.diagnosisId}`);

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const dark = rgb(0.2, 0.2, 0.2);

  // --- QR code (left column, top row) ---
  const qrDataUrl = await QRCode.toDataURL(payload.qrTargetUrl, { margin: 0, width: 256 });
  const qrBase64 = getBase64FromDataUrl(qrDataUrl);
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));

  const qrSize = Math.min(COL_W, TOP_ROW_H);
  const qrX = (COL_W - qrSize) / 2;
  const qrY = BOT_ROW_H + (TOP_ROW_H - qrSize) / 2;

  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  // --- Logo (right column, top row) ---
  const logoBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'));
  const logoImage = await pdfDoc.embedPng(logoBytes);

  const logoSize = Math.min(COL_W, TOP_ROW_H);
  const logoX = COL_W + (COL_W - logoSize) / 2;
  const logoY = BOT_ROW_H + (TOP_ROW_H - logoSize) / 2;

  page.drawImage(logoImage, { x: logoX, y: logoY, width: logoSize, height: logoSize });

  // --- Patient name (bottom row, single column spanning full width) ---
  const patientName = `${payload.formData.nombre} ${payload.formData.apellido}`;
  const fontSize = 7;
  const textWidth = fontRegular.widthOfTextAtSize(patientName, fontSize);
  const textX = Math.max(2, (PAGE_W - textWidth) / 2);
  const textY = (BOT_ROW_H - fontSize) / 2;

  page.drawText(patientName, {
    x: textX,
    y: textY,
    size: fontSize,
    font: fontRegular,
    color: dark,
  });

  // --- Grid dividers ---
  const gridColor = rgb(0.75, 0.75, 0.75);

  // Horizontal line between rows
  page.drawLine({
    start: { x: 0, y: BOT_ROW_H },
    end: { x: PAGE_W, y: BOT_ROW_H },
    thickness: 0.5,
    color: gridColor,
  });

  // Vertical line between columns (top row only)
  page.drawLine({
    start: { x: COL_W, y: BOT_ROW_H },
    end: { x: COL_W, y: PAGE_H },
    thickness: 0.5,
    color: gridColor,
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function POST(request: NextRequest) {
  let body: DiagnosisPdfBody;

  try {
    body = (await request.json()) as DiagnosisPdfBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Cuerpo de solicitud invalido.' },
      { status: 400 },
    );
  }

  const diagnosisId = body.diagnosisId?.trim() ?? '';
  const qrTargetUrl = body.qrTargetUrl?.trim() ?? '';

  if (!diagnosisId || !qrTargetUrl || !body.formData) {
    return NextResponse.json(
      { ok: false, message: 'Los campos diagnosisId, qrTargetUrl y formData son obligatorios.' },
      { status: 400 },
    );
  }

  try {
    const pdfBuffer = await toPdfBuffer(body);

    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="etiqueta-${diagnosisId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[diagnosisPdf] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'No se pudo generar el PDF del diagnostico.' },
      { status: 500 },
    );
  }
}
