import { Container, Typography, Box, Paper } from '@mui/material';

export default function Dashboard() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1">
            Panel de control principal de la aplicación.
          </Typography>
        </Paper>
      </Box>   
    </Container>
  );
}