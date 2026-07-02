'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
} from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { isAuthenticated, isAuthLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json() as { ok: boolean; message?: string; token?: string };

      if (!res.ok || !data.ok || !data.token) {
        setErrorMessage(data.message ?? 'Credenciales incorrectas.');
        return;
      }

      login(data.token);
      // La redirección ocurre automáticamente via useEffect cuando isAuthenticated cambia
    } catch {
      setErrorMessage('Error de conexión. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
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
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}
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

            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              ¿No tienes cuenta?{' '}
              <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Regístrate aquí
              </Link>
            </Typography>


          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
