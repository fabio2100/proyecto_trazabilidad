import { Container, Box } from '@mui/material';
import PatientForm from '@/components/forms/PatientForm';

export default function NuevoPaciente() {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <PatientForm />
      </Box>
    </Container>
  );
}