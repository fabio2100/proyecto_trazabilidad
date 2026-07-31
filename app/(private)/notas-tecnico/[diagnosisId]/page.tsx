'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface DiagnosisData {
  id: string;
  patientId: string;
  patientNombre: string | null;
  patientApellido: string | null;
  creatorName: string | null;
  diagnosis: string;
  material: string;
  profesionalSolicitante: string;
  biopsasPrevias: boolean;
  createdAt: string;
  notasTecnicoCuerpo: string | null;
  notasTecnicoImagenes: string[];
}

export default function NotasTecnicoPage() {
  const diagnosisId = useParams<{ diagnosisId: string }>().diagnosisId || '';
  const { isAuthenticated, isAuthLoading, perfilId } = useAuth();
  const router = useRouter();

  // Perfiles: 2 = tecnico, 4 = superusuario
  const hasPermission = perfilId === 2 || perfilId === 4;

  const [notas, setNotas] = useState('');
  const [savingNotas, setSavingNotas] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !diagnosisId) return;

    setLoadingDiagnosis(true);
    fetch(`/api/getDiagnosis?id=${encodeURIComponent(diagnosisId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          setDiagnosisData(json.data);
          if (json.data.notasTecnicoCuerpo) {
            setNotas(json.data.notasTecnicoCuerpo);
          }
          if (Array.isArray(json.data.notasTecnicoImagenes)) {
            setImagenes(json.data.notasTecnicoImagenes);
          }
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
        <Alert severity="error">Acceso denegado</Alert>
      </Container>
    );
  }

  if (!hasPermission) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">Acceso denegado para este usuario</Alert>
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
    const notasValue = notas.trim();
    setSaveMessage(null);
    setSaveError(false);

    if (!notasValue) {
      setSaveError(true);
      setSaveMessage('Debe ingresar las notas del técnico antes de guardar.');
      return;
    }

    try {
      setSavingNotas(true);
      const response = await fetch('/api/guardarNotasTecnico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosisId,
          cuerpo: notasValue,
          imagenes,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSaveError(false);
        setSaveMessage(data.message ?? 'Notas del técnico guardadas correctamente.');
      } else {
        setSaveError(true);
        setSaveMessage(data.message ?? 'No se pudieron guardar las notas del técnico.');
      }
    } catch {
      setSaveError(true);
      setSaveMessage('Error de red al guardar las notas del técnico.');
    } finally {
      setSavingNotas(false);
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setSaveMessage(null);
    setSaveError(false);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setSaveError(true);
      setSaveMessage('Formato no soportado. Use JPG, PNG, WEBP o GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError(true);
      setSaveMessage('La imagen supera el máximo de 5MB.');
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/notas-tecnico-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok || !data.url) {
        setSaveError(true);
        setSaveMessage(data.message ?? 'No se pudo subir la imagen.');
        return;
      }

      setImagenes((prev) => [...prev, data.url]);
      setSaveError(false);
      setSaveMessage('Imagen subida correctamente. Recuerda guardar las notas para persistir los cambios.');
    } catch {
      setSaveError(true);
      setSaveMessage('Error de red al subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (url: string) => {
    setImagenes((prev) => prev.filter((item) => item !== url));
  };

  const pacienteNombre =
    diagnosisData?.patientApellido && diagnosisData?.patientNombre
      ? `${diagnosisData.patientApellido}, ${diagnosisData.patientNombre}`
      : diagnosisData?.patientId ?? '';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => router.push('/pacientes')} size="small" aria-label="Volver a pacientes">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Notas del Técnico
              </Typography>
            </Box>
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
                  Datos del paciente y diagnóstico
                </Typography>
                {pacienteNombre && (
                  <Typography variant="body2"><strong>Paciente:</strong> {pacienteNombre}</Typography>
                )}
                <Typography variant="body2"><strong>DNI:</strong> {diagnosisData.patientId}</Typography>
                <Typography variant="body2"><strong>Diagnóstico:</strong> {diagnosisData.diagnosis}</Typography>
                <Typography variant="body2"><strong>Material:</strong> {diagnosisData.material}</Typography>
                <Typography variant="body2"><strong>Profesional solicitante:</strong> {diagnosisData.profesionalSolicitante}</Typography>
                <Typography variant="body2"><strong>Creado por:</strong> {diagnosisData.creatorName ?? 'No disponible'}</Typography>
                <Typography variant="body2"><strong>Biopsias previas:</strong> {diagnosisData.biopsasPrevias ? 'Sí' : 'No'}</Typography>
                <Typography variant="body2"><strong>Fecha:</strong> {new Date(diagnosisData.createdAt).toLocaleString()}</Typography>
              </Stack>
            </Paper>
          )}

          <TextField
            id="notas-tecnico"
            label="Notas del técnico"
            multiline
            minRows={8}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Escriba aquí las notas del técnico..."
            fullWidth
          />

          <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Imágenes
              </Typography>

              <Box>
                <Button variant="outlined" component="label" disabled={uploadingImage}>
                  {uploadingImage ? 'Subiendo imagen...' : 'Agregar imagen'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    hidden
                    onChange={handleUploadImage}
                  />
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Formatos permitidos: JPG, PNG, WEBP, GIF. Tamaño máximo: 5MB.
                </Typography>
              </Box>

              {imagenes.length === 0 ? (
                <Typography variant="body2">No hay imágenes cargadas.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {imagenes.map((url) => (
                    <Paper key={url} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <Box
                          component="img"
                          src={url}
                          alt="Imagen de nota técnica"
                          sx={{ width: { xs: '100%', sm: 160 }, height: { xs: 'auto', sm: 110 }, objectFit: 'cover', borderRadius: 1 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                            {url}
                          </Typography>
                        </Box>
                        <Button color="error" onClick={() => handleRemoveImage(url)}>
                          Quitar
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>

          {saveMessage && (
            <Alert severity={saveError ? 'error' : 'success'}>
              {saveMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              id="btn-guardar-notas-tecnico"
              onClick={handleGuardar}
              variant="contained"
              size="large"
              disabled={savingNotas}
            >
              {savingNotas ? 'Guardando...' : 'Guardar notas del técnico'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
