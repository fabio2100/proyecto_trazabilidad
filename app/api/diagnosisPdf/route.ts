import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

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

async function toPdfBuffer(payload: DiagnosisPdfBody) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Diagnostico ${payload.diagnosisId}`);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const qrDataUrl = await QRCode.toDataURL(payload.qrTargetUrl, {
    margin: 1,
    width: 256,
  });
  const qrBase64 = getBase64FromDataUrl(qrDataUrl);
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));

  const left = 50;
  const right = page.getWidth() - 50;
  const contentWidth = page.getWidth() - 100;

  let y = page.getHeight() - 50;

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

  const qrSize = 130;
  page.drawImage(qrImage, {
    x: right - qrSize,
    y: page.getHeight() - 50 - qrSize,
    width: qrSize,
    height: qrSize,
  });

  drawLine('Diagnostico medico', 20, true);
  drawLine(`ID diagnostico: ${payload.diagnosisId}`, 11, false);
  drawLine(`Fecha de emision: ${new Date().toLocaleString()}`, 11, false);
  y -= 10;

  drawLine('Informacion del paciente', 14, true);
  drawLine(`DNI: ${payload.formData.dni}`);
  drawLine(`Nombre: ${payload.formData.nombre} ${payload.formData.apellido}`);
  drawLine(`Edad: ${payload.formData.edad}`);
  drawLine(`Email: ${payload.formData.email}`);
  drawLine(`Telefono: ${payload.formData.telefono?.trim() ? payload.formData.telefono : 'Sin dato'}`);
  y -= 8;

  drawLine('Informacion del diagnostico', 14, true);
  drawLine(`Material: ${payload.formData.material}`);
  drawLine(`Profesional solicitante: ${payload.formData.profesionalSolicitante}`);
  drawLine(`Obra social FAMAS: ${payload.formData.obraSocialFamas}`);
  drawLine(`Biopsias previas: ${payload.formData.biopsiasPrevias}`);
  drawLine('Descripcion del diagnostico:', 11, true);
  drawParagraph(payload.formData.diagnostico || 'Sin descripcion.');
  y -= 8;

  drawLine('URL para informe con QR:', 11, true);
  drawParagraph(payload.qrTargetUrl, 10);

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
        'Content-Disposition': `inline; filename="diagnostico-${diagnosisId}.pdf"`,
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
