'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function PdfViewerContent() {
  const params = useParams();
  const idInforme = params.idInforme as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const onlyDiagnosis = searchParams.get('onlyDiagnosis') === 'true';

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      setErrorMessage('');
      setPdfUrl(null);

      if (!idInforme) {
        setErrorMessage(
          onlyDiagnosis
            ? 'No se especificó el diagnóstico a visualizar.'
            : 'No se especificó el informe a visualizar.'
        );
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/informePdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...(onlyDiagnosis ? { diagnosisId: idInforme } : { idInforme }),
            onlyDiagnosis,
          }),
        });

        if (!response.ok) {
          setErrorMessage(
            onlyDiagnosis
              ? 'No se pudo cargar el diagnóstico. Intente nuevamente.'
              : 'No se pudo cargar el informe. Intente nuevamente.'
          );
          setIsLoading(false);
          return;
        }

        const blob = await response.blob();
        setPdfBlob(blob);

        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error al cargar PDF:', error);
        setErrorMessage(
          onlyDiagnosis
            ? 'Error al cargar el diagnóstico. Intente nuevamente.'
            : 'Error al cargar el informe. Intente nuevamente.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadPdf();

    // Limpiar URL al desmontar
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [idInforme, onlyDiagnosis]);

  const handleDownloadPdf = () => {
    if (!pdfBlob) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = onlyDiagnosis ? `diagnostico_${idInforme}.pdf` : `informe_${idInforme}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => router.push('/pacientes')} size="small" aria-label="Volver a pacientes">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              {onlyDiagnosis ? 'Visualizador de Diagnóstico' : 'Visualizador de Informe'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleDownloadPdf}
            disabled={!pdfUrl}
          >
            Descargar PDF
          </Button>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {!isLoading && pdfUrl && (
          <Box
            sx={{
              mt: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <iframe
              src={pdfUrl}
              title="Visualizador de PDF"
              style={{
                width: '100%',
                height: '800px',
                border: 'none',
              }}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default function PdfViewerPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
      <PdfViewerContent />
    </Suspense>
  );
}
