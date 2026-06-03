'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Button,
  Box,
  CircularProgress,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { deleteDiagnosis, getDiagnoses } from '@/services/diagnosisService';
import { Diagnosis } from '@/services/diagnosisService';

export default function DiagnosesPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [diagnosisIdDeleting, setDiagnosisIdDeleting] = useState<string | null>(null);

  // Estados para el Dialog de generación de links
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedDiagnosisForLink, setSelectedDiagnosisForLink] = useState<Diagnosis | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [generatedLinkData, setGeneratedLinkData] = useState<{
    link: string;
    password: string;
    expiresAt: string;
  } | null>(null);
  const [dialogErrorMessage, setDialogErrorMessage] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string>('');

  useEffect(() => {
    const loadDiagnoses = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getDiagnoses();
        setDiagnoses(data);
      } catch {
        setErrorMessage('No se pudieron cargar los diagnósticos. Intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadDiagnoses();
  }, []);

  const handleDeleteDiagnosis = async (diagnosisId: string) => {
    setErrorMessage('');
    setDiagnosisIdDeleting(diagnosisId);

    try {
      await deleteDiagnosis(diagnosisId);
      setDiagnoses((prev) => prev.filter((diagnosis) => diagnosis.id !== diagnosisId));
    } catch {
      setErrorMessage('No se pudo eliminar el diagnóstico. Intente nuevamente.');
    } finally {
      setDiagnosisIdDeleting(null);
    }
  };

  const handleOpenGenerateLinkDialog = (diagnosis: Diagnosis) => {
    setSelectedDiagnosisForLink(diagnosis);
    setGeneratedLinkData(null);
    setDialogErrorMessage('');
    setCopyFeedback('');
    setIsDialogOpen(true);
  };

  const handleGenerateLink = async () => {
    if (!selectedDiagnosisForLink || !selectedDiagnosisForLink.informeId) {
      setDialogErrorMessage('Error: No hay ID de informe disponible.');
      return;
    }

    setIsGeneratingLink(true);
    setDialogErrorMessage('');
    setCopyFeedback('');

    try {
      const response = await fetch('/api/sharedReports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ informeId: selectedDiagnosisForLink.informeId }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setDialogErrorMessage(data.message || 'Error al generar el link.');
        setIsGeneratingLink(false);
        return;
      }

      setGeneratedLinkData({
        link: data.link,
        password: data.password,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      console.error('Error generando link:', error);
      setDialogErrorMessage('Error al generar el link. Intente nuevamente.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLinkData) return;

    const formattedExpiresAt = new Date(generatedLinkData.expiresAt).toLocaleString();
    const copyText = `Acceso al informe:\nLink: ${generatedLinkData.link}\nContraseña: ${generatedLinkData.password}\nVálido hasta: ${formattedExpiresAt}`;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopyFeedback('Datos de acceso copiados al portapapeles.');
      setTimeout(() => setCopyFeedback(''), 3000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      setCopyFeedback('Error al copiar. Intente manualmente.');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedDiagnosisForLink(null);
    setGeneratedLinkData(null);
    setDialogErrorMessage('');
    setCopyFeedback('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h2" component="h2" gutterBottom>
          Diagnósticos
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {!isLoading && !errorMessage && diagnoses.length === 0 && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No hay diagnósticos cargados.
          </Typography>
        )}

        {!isLoading && !errorMessage && diagnoses.length > 0 && (
          <Box sx={{ mt: 2, overflowX: 'auto' }}>
            <Table size="small" aria-label="Listado de diagnósticos">
              <TableHead>
                <TableRow>
                  <TableCell>Paciente</TableCell>
                  <TableCell>DNI</TableCell>
                  <TableCell>Diagnóstico</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Profesional Solicitante</TableCell>
                  <TableCell>Biopsias Previas</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Informe</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diagnoses.map((diagnosis) => (
                  <TableRow key={diagnosis.id} hover>
                    <TableCell>
                      {diagnosis.patientApellido && diagnosis.patientNombre ? (
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {diagnosis.patientApellido}, {diagnosis.patientNombre}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Paciente no disponible
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{diagnosis.patientId}</TableCell>
                    <TableCell>{diagnosis.diagnosis}</TableCell>
                    <TableCell>{diagnosis.material}</TableCell>
                    <TableCell>{diagnosis.profesionalSolicitante}</TableCell>
                    <TableCell>{diagnosis.biopsasPrevias ? 'Sí' : 'No'}</TableCell>
                    <TableCell>{new Date(diagnosis.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{diagnosis.hasInforme ? 'Disponible' : 'Pendiente'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          component={Link}
                          href={`/pdf/${diagnosis.informeId}`}
                          variant="outlined"
                          size="small"
                          disabled={!diagnosis.hasInforme || !diagnosis.informeId}
                          title={!diagnosis.hasInforme ? 'No hay informe disponible' : undefined}
                        >
                          Ver informe
                        </Button>
                        <Button
                          component={Link}
                          href={`/pacientes/${diagnosis.id}/editar`}
                          variant="outlined"
                          size="small"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenGenerateLinkDialog(diagnosis)}
                          disabled={
                            !diagnosis.hasInforme ||
                            !diagnosis.informeId ||
                            (isGeneratingLink && selectedDiagnosisForLink?.id === diagnosis.id)
                          }
                        >
                          {isGeneratingLink && selectedDiagnosisForLink?.id === diagnosis.id
                            ? 'Generando...'
                            : 'Generar link'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          disabled={true}
                          title="Eliminación no disponible todavía"
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Dialog para generar link temporal protegido */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Link temporal generado</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {dialogErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogErrorMessage}
            </Alert>
          )}

          {copyFeedback && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {copyFeedback}
            </Alert>
          )}

          {isGeneratingLink && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!isGeneratingLink && generatedLinkData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Link de acceso"
                value={generatedLinkData.link}
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                InputProps={{ readOnly: true }}
              />

              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Contraseña de acceso:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {generatedLinkData.password}
                </Typography>
              </Box>

              <TextField
                label="Vencimiento"
                value={new Date(generatedLinkData.expiresAt).toLocaleString()}
                fullWidth
                variant="outlined"
                InputProps={{ readOnly: true }}
              />

              <Typography variant="caption" color="textSecondary">
                Comparte el link y la contraseña con quien desees que acceda al informe.
              </Typography>
            </Box>
          )}

          {!isGeneratingLink && !generatedLinkData && !dialogErrorMessage && (
            <Typography variant="body2" color="textSecondary">
              Haz clic en "Generar" para crear un link temporal protegido.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {!isGeneratingLink && generatedLinkData && (
            <Button onClick={handleCopyLink} variant="contained" color="primary">
              Copiar datos de acceso
            </Button>
          )}
          {!isGeneratingLink && !generatedLinkData && (
            <Button onClick={handleGenerateLink} variant="contained" color="primary">
              Generar
            </Button>
          )}
          <Button onClick={handleCloseDialog} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
