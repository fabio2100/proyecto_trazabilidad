'use client';

import { useState } from 'react';
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
import Link from 'next/link';

interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function Register() {
  const router = useRouter();

  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Validaciones frontend
  const isFormValid =
    nombre.trim() &&
    email.trim() &&
    email.includes('@') &&
    password &&
    confirmPassword &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Limpiar mensajes previos
    setSuccessMessage('');
    setErrorMessage('');

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    // Validar email
    if (!email.includes('@')) {
      setErrorMessage('Email inválido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: nombre.trim(),
          password,
        }),
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'Error al registrar usuario.');
        setIsSubmitting(false);
        return;
      }

      // Registro exitoso
      setSuccessMessage(data.message || 'Usuario registrado exitosamente.');
      setNombre('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error en registro:', error);
      setErrorMessage('Error al registrar usuario. Intenta más tarde.');
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}>
            Crear Cuenta
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Completa el formulario para registrarte en el sistema.
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {!successMessage ? (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                margin="normal"
                disabled={isSubmitting}
              />

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

              <TextField
                fullWidth
                label="Confirmar Contraseña"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu contraseña"
                margin="normal"
                disabled={isSubmitting}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isSubmitting || !isFormValid}
                sx={{ mt: 3 }}
              >
                {isSubmitting ? 'Registrando...' : 'Registrarse'}
              </Button>

              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
                  Inicia sesión aquí
                </Link>
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => router.push('/login')}
              >
                Ir a Login
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
