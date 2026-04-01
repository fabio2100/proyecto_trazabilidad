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
  Alert,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { isAuthenticated, isAuthLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('error');

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlertMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json() as { ok: boolean; message?: string };

      if (data.ok) {
        setAlertSeverity('success');
        setAlertMessage('Acceso concedido. Redirigiendo...');
        login();
      } else {
        setAlertSeverity('error');
        setAlertMessage(data.message ?? 'Credenciales incorrectas. Por favor verifique su email y contraseña.');
      }
    } catch {
      setAlertSeverity('error');
      setAlertMessage('Credenciales incorrectas. Por favor verifique su email y contraseña.');
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

            {alertMessage && (
              <Alert severity={alertSeverity} sx={{ mt: 2 }}>
                {alertMessage}
              </Alert>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
