'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Button,
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
import { deletePatient, getPatients } from '@/services/patientService';
import { Patient } from '@/types/patient';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [patientIdDeleting, setPatientIdDeleting] = useState<string | null>(null);

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

  const handleDeletePatient = async (patientId: string) => {
    setErrorMessage('');
    setPatientIdDeleting(patientId);

    try {
      await deletePatient(patientId);
      setPatients((prev) => prev.filter((patient) => patient.id !== patientId));
    } catch {
      setErrorMessage('No se pudo eliminar el paciente. Intente nuevamente.');
    } finally {
      setPatientIdDeleting(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h2" component="h2" gutterBottom>
          Pacientes
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
            No hay pacientes cargados.
          </Typography>
        )}

        {!isLoading && !errorMessage && patients.length > 0 && (
          <Box sx={{ mt: 2, overflowX: 'auto' }}>
            <Table size="small" aria-label="Listado de pacientes">
              <TableHead>
                <TableRow>
                  <TableCell>Apellido</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>DNI</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Biopsias Previas</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>{patient.apellido}</TableCell>
                    <TableCell>{patient.nombre}</TableCell>
                    <TableCell>{patient.dni}</TableCell>
                    <TableCell>{patient.telefono}</TableCell>
                    <TableCell>{patient.material}</TableCell>
                    <TableCell>{patient.biopsiasPrevias}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          component={Link}
                          href={`/pacientes/${patient.id}/editar`}
                          variant="outlined"
                          size="small"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          disabled={patientIdDeleting === patient.id}
                          onClick={() => handleDeletePatient(patient.id)}
                        >
                          {patientIdDeleting === patient.id ? 'Eliminando...' : 'Eliminar'}
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
    </Container>
  );
}
