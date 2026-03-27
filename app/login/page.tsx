'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { isAuthenticated, isAuthLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);

    // Simular delay de autenticación (sin validar credenciales reales)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    login();
    setIsSubmitting(false);

    // La redirección ocurre automáticamente via useEffect cuando isAuthenticated cambia
  };

  if (isAuthLoading) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}>
            Acceso al Sistema
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Ingrese sus credenciales para continuar.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              margin="normal"
              disabled={isSubmitting}
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              margin="normal"
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting || !email || !password}
              sx={{ mt: 3 }}
            >
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>

            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
              Nota: Este es un login simulado sin validación de credenciales.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
