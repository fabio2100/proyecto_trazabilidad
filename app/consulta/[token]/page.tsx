'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export default function SharedReportAccessPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [informeId, setInformeId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const loadPdf = async (idInforme: string) => {
    setIsLoadingPdf(true);

    try {
      const response = await fetch('/api/sharedReports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, informeId: idInforme }),
      });

      if (!response.ok) {
        setErrorMessage('No se pudo cargar el informe. Intente nuevamente.');
        setIsLoadingPdf(false);
        return;
      }

      const blob = await response.blob();
      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error al cargar PDF:', error);
      setErrorMessage('Error al cargar el informe. Intente nuevamente.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setInformeId(null);
    setPdfUrl(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/sharedReports/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrorMessage(data.message || 'Error al validar el link.');
        setIsSubmitting(false);
        return;
      }

      setInformeId(data.informeId);
      setSuccessMessage('Acceso validado correctamente.');
      setIsSubmitting(false);
      await loadPdf(data.informeId);
    } catch (error) {
      console.error({ token, password, error });
      setErrorMessage('Error al validar el link. Intente nuevamente.');
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBlob) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = `informe_${informeId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={4} sx={{ p: 4, width: '100%', maxWidth: 600 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Acceso protegido
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Ingresa la contraseña asociada al token para acceder al informe protegido.
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {!informeId ? (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña"
                margin="normal"
                disabled={isSubmitting}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isSubmitting || !password}
                sx={{ mt: 2 }}
              >
                {isSubmitting ? 'Validando...' : 'Ver informe'}
              </Button>
            </Box>
          ) : (
            <Box>
              {isLoadingPdf && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {pdfUrl && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleDownloadPdf}
                    >
                      Descargar PDF
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      overflow: 'hidden',
                      mt: 2,
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
                </Box>
              )}
            </Box>
          )}

          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 3 }}>
            Token: {token ?? 'No disponible'}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
