'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { getPatients, DiagnosisRecord } from '@/services/patientService';

export default function PatientsPage() {
  const [patients, setPatients] = useState<DiagnosisRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getPatients();
        setPatients(data);
      } catch {
        setErrorMessage('No se pudieron cargar los pacientes. Intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadPatients();
  }, []);

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

        {!isLoading && !errorMessage && patients.length === 0 && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No hay diagnósticos cargados.
          </Typography>
        )}

        {!isLoading && !errorMessage && patients.length > 0 && (
          <Box sx={{ mt: 2, overflowX: 'auto' }}>
            <Table size="small" aria-label="Listado de pacientes">
              <TableHead>
                <TableRow>
                  <TableCell>Paciente ID</TableCell>
                  <TableCell>Diagnóstico</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Profesional Solicitante</TableCell>
                  <TableCell>Biopsias Previas</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>{patient.patientId}</TableCell>
                    <TableCell>{patient.diagnosis}</TableCell>
                    <TableCell>{patient.material}</TableCell>
                    <TableCell>{patient.profesionalSolicitante}</TableCell>
                    <TableCell>{patient.biopsasPrevias ? 'Sí' : 'No'}</TableCell>
                    <TableCell>{new Date(patient.created_at).toLocaleDateString('es-AR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
