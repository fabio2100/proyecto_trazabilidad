'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';

interface Perfil {
  id: number;
  tipo: string;
}

export default function CreateUserPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [checkPassword, setCheckPassword] = useState('');
  const [perfilId, setPerfilId] = useState<number | ''>('');
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);

  const [emailError, setEmailError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load perfiles on mount
  useEffect(() => {
    fetch('/api/getPerfiles')
      .then((r) => r.json())
      .then((data) => {
        if (data.perfiles) setPerfiles(data.perfiles);
      });
  }, []);

  // Debounced email check every 3 seconds
  useEffect(() => {
    setEmailError('');
    if (!email.trim() || !email.includes('@')) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await fetch(`/api/checkEmail?email=${encodeURIComponent(email.trim())}`);
        const data = await res.json();
        if (data.exists) {
          setEmailError('Usuario ya existe.');
        }
      } finally {
        setEmailChecking(false);
      }
    }, 3000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  const handlePasswordBlur = () => {
    if (password && checkPassword && password !== checkPassword) {
      setPasswordError('Passwords no coinciden.');
    } else {
      setPasswordError('');
    }
  };

  const isFormValid =
    email.trim() !== '' &&
    email.includes('@') &&
    !emailError &&
    !emailChecking &&
    name.trim() !== '' &&
    password !== '' &&
    checkPassword !== '' &&
    password === checkPassword &&
    !passwordError &&
    perfilId !== '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');

    if (password !== checkPassword) {
      setPasswordError('Passwords no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          password,
          perfilId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.message || 'Error al crear usuario.');
        return;
      }

      router.push('/login');
    } catch {
      setSubmitError('Error de conexión. Intenta más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Crear Usuario
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={
                emailChecking
                  ? 'Verificando...'
                  : emailError || ' '
              }
              slotProps={{
                input: {
                  endAdornment: emailChecking ? (
                    <CircularProgress size={18} />
                  ) : undefined,
                },
              }}
            />

            <TextField
              label="Nombre"
              type="text"
              fullWidth
              margin="normal"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="normal"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handlePasswordBlur}
              error={!!passwordError}
              helperText={passwordError || ' '}
            />

            <TextField
              label="Confirmar Contraseña"
              type="password"
              fullWidth
              margin="normal"
              required
              value={checkPassword}
              onChange={(e) => setCheckPassword(e.target.value)}
              onBlur={handlePasswordBlur}
              error={!!passwordError}
              helperText={passwordError || ' '}
            />

            <TextField
              label="Perfil"
              select
              fullWidth
              margin="normal"
              required
              value={perfilId}
              onChange={(e) => setPerfilId(Number(e.target.value))}
            >
              {perfiles.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.tipo}
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!isFormValid || isSubmitting}
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Crear'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
