'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface DiagnosisData {
  id: string;
  patientId: string;
  creatorName: string | null;
  diagnosis: string;
  material: string;
  profesionalSolicitante: string;
  biopsasPrevias: boolean;
  createdAt: string;
  notasTecnicoId: string | null;
  notasTecnicoCuerpo: string | null;
  notasTecnicoImagenes: string[];
}

function InformesContent() {
  const searchParams = useSearchParams();
  const diagnosisId = useParams<{diagnosisId: string}>().diagnosisId || searchParams.get('diagnosisId') || '';
  const { isAuthenticated, isAuthLoading } = useAuth();

  const [informe, setInforme] = useState('');
  const [savingInforme, setSavingInforme] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !diagnosisId) return;

    setLoadingDiagnosis(true);
    fetch(`/api/getDiagnosis?id=${encodeURIComponent(diagnosisId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          setDiagnosisData(json.data);
        } else {
          setDiagnosisError(json.message ?? 'Estudio no encontrado');
        }
      })
      .catch(() => setDiagnosisError('Error al obtener el estudio.'))
      .finally(() => setLoadingDiagnosis(false));
  }, [isAuthenticated, diagnosisId]);

  if (isAuthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !diagnosisId) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">Acceso denegado o falta diagnosisId en la URL.</Alert>
      </Container>
    );
  }

  if (!loadingDiagnosis && diagnosisError) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">{diagnosisError}</Alert>
      </Container>
    );
  }

  const handleGuardar = async () => {
    const informeValue = informe.trim();
    setSaveMessage(null);
    setSaveError(false);

    if (!informeValue) {
      setSaveError(true);
      setSaveMessage('Debe ingresar un informe antes de guardar.');
      return;
    }

    try {
      setSavingInforme(true);
      const response = await fetch('/api/guardarInforme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosisId,
          informe: informeValue,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSaveError(false);
        setSaveMessage(data.message ?? 'Informe guardado correctamente.');
      } else {
        setSaveError(true);
        setSaveMessage(data.message ?? 'No se pudo guardar el informe.');
      }
    } catch {
      setSaveError(true);
      setSaveMessage('Error de red al guardar el informe.');
    } finally {
      setSavingInforme(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Carga de Informe
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ID del estudio: {diagnosisId}
            </Typography>
          </Box>

          <Divider />

          {loadingDiagnosis && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Cargando datos del estudio...</Typography>
            </Box>
          )}

          {diagnosisData && (
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}>
              <Stack spacing={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Datos del diagnóstico
                </Typography>
                <Typography variant="body2"><strong>Diagnóstico:</strong> {diagnosisData.diagnosis}</Typography>
                <Typography variant="body2"><strong>Material:</strong> {diagnosisData.material}</Typography>
                <Typography variant="body2"><strong>Profesional solicitante:</strong> {diagnosisData.profesionalSolicitante}</Typography>
                <Typography variant="body2"><strong>Creado por:</strong> {diagnosisData.creatorName ?? 'No disponible'}</Typography>
                <Typography variant="body2"><strong>Biopsias previas:</strong> {diagnosisData.biopsasPrevias ? 'Sí' : 'No'}</Typography>
                <Typography variant="body2"><strong>Fecha:</strong> {new Date(diagnosisData.createdAt).toLocaleString()}</Typography>
              </Stack>
            </Paper>
          )}

          {diagnosisData && (
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}>
              <Stack spacing={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Notas del técnico
                </Typography>
                {diagnosisData.notasTecnicoId ? (
                  <>
                    <Typography variant="body2"><strong>ID nota:</strong> {diagnosisData.notasTecnicoId}</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      <strong>Contenido:</strong> {diagnosisData.notasTecnicoCuerpo ?? 'Sin contenido'}
                    </Typography>
                    <Typography variant="body2"><strong>Imágenes:</strong></Typography>
                    {diagnosisData.notasTecnicoImagenes && diagnosisData.notasTecnicoImagenes.length > 0 ? (
                      <Stack spacing={1.5}>
                        {diagnosisData.notasTecnicoImagenes.map((imageUrl, index) => (
                          <Paper key={`${imageUrl}-${index}`} variant="outlined" sx={{ p: 1.5 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                              <Box
                                component="img"
                                src={imageUrl}
                                alt={`Imagen técnica ${index + 1}`}
                                sx={{ width: { xs: '100%', sm: 160 }, height: { xs: 'auto', sm: 110 }, objectFit: 'cover', borderRadius: 1 }}
                              />
                              <Typography
                                component="a"
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="caption"
                                sx={{ wordBreak: 'break-all' }}
                              >
                                {imageUrl}
                              </Typography>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2">Sin imágenes registradas.</Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2">Sin notas del técnico registradas.</Typography>
                )}
              </Stack>
            </Paper>
          )}

          <TextField
            id="informe"
            label="Informe"
            multiline
            minRows={8}
            value={informe}
            onChange={(e) => setInforme(e.target.value)}
            placeholder="Escriba aquí el informe..."
            fullWidth
          />

          {saveMessage && (
            <Alert severity={saveError ? 'error' : 'success'}>
              {saveMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={handleGuardar}
              variant="contained"
              size="large"
              disabled={savingInforme}
            >
              {savingInforme ? 'Guardando...' : 'Guardar Informe'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default function InformesPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>}>
      <InformesContent />
    </Suspense>
  );
}
