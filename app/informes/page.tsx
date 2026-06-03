'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  diagnosis: string;
  material: string;
  profesionalSolicitante: string;
  biopsasPrevias: boolean;
  createdAt: string;
}

function InformesContent() {
  const searchParams = useSearchParams();
  const diagnosisId = useParams<{diagnosisId: string}>().diagnosisId || searchParams.get('diagnosisId') || '';

  const [authValid, setAuthValid] = useState<boolean | null>(null);
  const [informe, setInforme] = useState('');
  const [savingInforme, setSavingInforme] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('auth');
    setAuthValid(auth === 'true');
  }, []);

  useEffect(() => {
    if (!authValid || !diagnosisId) return;

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
  }, [authValid, diagnosisId]);

  if (authValid === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!authValid || !diagnosisId) {
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
                <Typography variant="body2"><strong>Biopsias previas:</strong> {diagnosisData.biopsasPrevias ? 'Sí' : 'No'}</Typography>
                <Typography variant="body2"><strong>Fecha:</strong> {new Date(diagnosisData.createdAt).toLocaleString()}</Typography>
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
