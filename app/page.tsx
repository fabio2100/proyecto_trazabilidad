import { Container, Typography, Box } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Home
        </Typography>
        <Typography variant="body1">
          Bienvenido a la aplicación de trazabilidad de muestras patológicas.
        </Typography>
      </Box>
    </Container>
  );
}
