'use client';

import { useEffect, useState, useMemo } from 'react';
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
  TableSortLabel,
  InputAdornment,
} from '@mui/material';
import { deleteDiagnosis, getDiagnoses } from '@/services/diagnosisService';
import { Diagnosis } from '@/services/diagnosisService';
import SearchIcon from '@mui/icons-material/Search';

export default function DiagnosesPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [diagnosisIdDeleting, setDiagnosisIdDeleting] = useState<string | null>(null);
  const [etiquetaLoadingId, setEtiquetaLoadingId] = useState<string | null>(null);

  // Estados para ordenación y búsqueda
  const [orderBy, setOrderBy] = useState<keyof Diagnosis | 'paciente'>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleRequestSort = (property: keyof Diagnosis | 'paciente') => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredDiagnoses = useMemo(() => {
    if (!searchTerm.trim()) {
      return diagnoses;
    }

    const term = searchTerm.toLowerCase().trim();

    return diagnoses.filter((d) => {
      // Check patient name
      const patientName = `${d.patientApellido || ''}, ${d.patientNombre || ''}`.toLowerCase();
      if (patientName.includes(term)) return true;

      // Check dni (patientId)
      if (d.patientId?.toLowerCase().includes(term)) return true;

      // Check diagnosis
      if (d.diagnosis?.toLowerCase().includes(term)) return true;

      // Check material
      if (d.material?.toLowerCase().includes(term)) return true;

      // Check profesionalSolicitante
      if (d.profesionalSolicitante?.toLowerCase().includes(term)) return true;

      // Check fecha
      const dateStr = new Date(d.created_at).toLocaleDateString().toLowerCase();
      if (dateStr.includes(term)) return true;

      // Check informe
      const informeStatus = (d.hasInforme ? 'Disponible' : 'Pendiente').toLowerCase();
      if (informeStatus.includes(term)) return true;

      return false;
    });
  }, [diagnoses, searchTerm]);

  const sortedDiagnoses = useMemo(() => {
    return [...filteredDiagnoses].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (orderBy === 'paciente') {
        const aName = `${a.patientApellido || ''}, ${a.patientNombre || ''}`.toLowerCase();
        const bName = `${b.patientApellido || ''}, ${b.patientNombre || ''}`.toLowerCase();
        aVal = aName;
        bVal = bName;
      } else if (orderBy === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else {
        aVal = a[orderBy];
        bVal = b[orderBy];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      }

      if (aVal === undefined || aVal === null) return order === 'asc' ? 1 : -1;
      if (bVal === undefined || bVal === null) return order === 'asc' ? -1 : 1;

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        if (aVal === bVal) return 0;
        return aVal ? (order === 'asc' ? 1 : -1) : (order === 'asc' ? -1 : 1);
      }

      if (aVal < bVal) {
        return order === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredDiagnoses, orderBy, order]);

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

  const handleVerEtiqueta = async (diagnosis: Diagnosis) => {
    setEtiquetaLoadingId(diagnosis.id);
    try {
      const qrTargetUrl = `${window.location.origin}/informes?diagnosisId=${encodeURIComponent(diagnosis.id)}`;
      const pdfResponse = await fetch('/api/diagnosisPdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisId: diagnosis.id,
          qrTargetUrl,
          formData: {
            dni: diagnosis.patientId ?? '',
            nombre: diagnosis.patientNombre ?? '',
            apellido: diagnosis.patientApellido ?? '',
            edad: '',
            email: '',
            telefono: '',
            material: diagnosis.material ?? '',
            profesionalSolicitante: diagnosis.profesionalSolicitante ?? '',
            obraSocialFamas: '',
            biopsiasPrevias: diagnosis.biopsasPrevias ? 'Sí' : 'No',
            diagnostico: diagnosis.diagnosis ?? '',
          },
        }),
      });

      if (!pdfResponse.ok) {
        setErrorMessage('No se pudo generar la etiqueta PDF.');
        return;
      }

      const pdfBlob = await pdfResponse.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
    } catch {
      setErrorMessage('Error al generar la etiqueta. Intente nuevamente.');
    } finally {
      setEtiquetaLoadingId(null);
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

        <TextField
          placeholder="Busque sobre la columna"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          sx={{ mb: 3 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

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
          <Box sx={{ mt: 2, overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
            <Table size="small" stickyHeader aria-label="Listado de diagnósticos">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'paciente'}
                      direction={orderBy === 'paciente' ? order : 'asc'}
                      onClick={() => handleRequestSort('paciente')}
                    >
                      Paciente
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'patientId'}
                      direction={orderBy === 'patientId' ? order : 'asc'}
                      onClick={() => handleRequestSort('patientId')}
                    >
                      DNI
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'diagnosis'}
                      direction={orderBy === 'diagnosis' ? order : 'asc'}
                      onClick={() => handleRequestSort('diagnosis')}
                    >
                      Diagnóstico
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'material'}
                      direction={orderBy === 'material' ? order : 'asc'}
                      onClick={() => handleRequestSort('material')}
                    >
                      Material
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'profesionalSolicitante'}
                      direction={orderBy === 'profesionalSolicitante' ? order : 'asc'}
                      onClick={() => handleRequestSort('profesionalSolicitante')}
                    >
                      Profesional Solicitante
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'biopsasPrevias'}
                      direction={orderBy === 'biopsasPrevias' ? order : 'asc'}
                      onClick={() => handleRequestSort('biopsasPrevias')}
                    >
                      Biopsias Previas
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'created_at'}
                      direction={orderBy === 'created_at' ? order : 'asc'}
                      onClick={() => handleRequestSort('created_at')}
                    >
                      Fecha
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'hasInforme'}
                      direction={orderBy === 'hasInforme' ? order : 'asc'}
                      onClick={() => handleRequestSort('hasInforme')}
                    >
                      Informe
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedDiagnoses.map((diagnosis) => (
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
                          href={`/informes/${diagnosis.id}`}
                          variant="outlined"
                          size="small"
                        >
                          Editar Informe
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => void handleVerEtiqueta(diagnosis)}
                          disabled={etiquetaLoadingId === diagnosis.id}
                        >
                          {etiquetaLoadingId === diagnosis.id ? 'Generando...' : 'Ver etiqueta'}
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
