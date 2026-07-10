import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DiagnosisPdfBody {
  diagnosisId: string;
  sampleCode: string | null;
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

function fitFontSize(
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  text: string,
  maxWidth: number,
  baseSize: number,
  minSize = 3.2,
): number {
  let size = baseSize;

  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.2;
  }

  return size;
}

async function toPdfBuffer(payload: DiagnosisPdfBody): Promise<Buffer> {
  const PAGE_W = 50 * MM;
  const PAGE_H = 25 * MM;
  const LEFT_COL_W = 20 * MM;
  const RIGHT_COL_W = PAGE_W - LEFT_COL_W;
  const QR_SIZE = 23 * MM;
  const MARGIN = 2 * MM;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Etiqueta ${payload.diagnosisId}`);

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.15, 0.15, 0.15);

  const qrDataUrl = await QRCode.toDataURL(payload.qrTargetUrl, {
    margin: 2,
    width: 512,
    errorCorrectionLevel: 'M',
  });
  const qrBase64 = getBase64FromDataUrl(qrDataUrl);
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));

  const qrX = LEFT_COL_W + (RIGHT_COL_W - QR_SIZE) / 2;
  const qrY = (PAGE_H - QR_SIZE) / 2;
  page.drawImage(qrImage, { x: qrX, y: qrY, width: QR_SIZE, height: QR_SIZE });

  const displayedCode = payload.sampleCode?.trim() ? payload.sampleCode.trim() : 'SIN-CÓDIGO';

  const leftContentWidth = LEFT_COL_W - MARGIN * 2;
  const titleText = 'LABORATORIO DE HISTOLOGÍA Y EMBRIOLOGÍA';
  const subtitleText = displayedCode;

  const titleFontSize = fitFontSize(fontBold, titleText, leftContentWidth, 7.2, 5.2);
  const subtitleFontSize = fitFontSize(fontRegular, subtitleText, leftContentWidth, 5.2, 4.0);

  const titleLines = titleText.split(' ');
  const wrappedTitle: string[] = [];
  let currentLine = '';

  for (const word of titleLines) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (fontBold.widthOfTextAtSize(testLine, titleFontSize) <= leftContentWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) wrappedTitle.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) wrappedTitle.push(currentLine);
  if (wrappedTitle.length > 3) {
    wrappedTitle.length = 3;
  }

  let currentY = PAGE_H - MARGIN;

  for (const line of wrappedTitle) {
    page.drawText(line, {
      x: MARGIN,
      y: currentY - titleFontSize,
      size: titleFontSize,
      font: fontBold,
      color: dark,
      lineHeight: titleFontSize + 1,
    });
    currentY -= titleFontSize + 2;
  }

  currentY -= 2;

  page.drawText(subtitleText, {
    x: MARGIN,
    y: currentY - subtitleFontSize,
    size: subtitleFontSize,
    font: fontRegular,
    color: dark,
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
