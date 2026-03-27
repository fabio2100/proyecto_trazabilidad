'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Alert, Box, CircularProgress, Container } from '@mui/material';
import PatientForm from '@/components/forms/PatientForm';
import { getPatientById } from '@/services/patientService';
import { Patient, PatientFormData } from '@/types/patient';

const mapPatientToFormData = (patient: Patient): PatientFormData => {
  return {
    apellido: patient.apellido,
    nombre: patient.nombre,
    material: patient.material,
    edad: patient.edad,
    dni: patient.dni,
    telefono: patient.telefono,
    profesionalSolicitante: patient.profesionalSolicitante,
    obraSocialFamas: patient.obraSocialFamas,
    biopsiasPrevias: patient.biopsiasPrevias,
    diagnostico: patient.diagnostico,
  };
};

export default function EditPatientPage() {
  const params = useParams<{ id: string }>();
  const patientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [initialData, setInitialData] = useState<PatientFormData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        setErrorMessage('No se encontró el identificador del paciente.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const patient = await getPatientById(patientId);

        if (!patient) {
          setErrorMessage('El paciente no existe o fue eliminado.');
          return;
        }

        setInitialData(mapPatientToFormData(patient));
      } catch {
        setErrorMessage('No se pudo cargar el paciente. Intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadPatient();
  }, [patientId]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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

      {!isLoading && !errorMessage && initialData && (
        <PatientForm mode="edit" patientId={patientId} initialData={initialData} />
      )}
    </Container>
  );
}
