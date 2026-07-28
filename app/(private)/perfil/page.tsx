'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function PerfilPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passwordMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (password && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!name.trim() && !password) {
      setError('Debe completar al menos un campo para actualizar.');
      return;
    }

    const body: { name?: string; password?: string } = {};
    if (name.trim()) body.name = name.trim();
    if (password) body.password = password;

    setLoading(true);
    try {
      const res = await fetch('/api/updateUser', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { success: boolean; message: string };

      if (!res.ok || !data.success) {
        setError(data.message ?? 'Error al actualizar el usuario.');
        return;
      }

      setSuccess('Datos actualizados correctamente.');
      setName('');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <AccountCircleIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={600}>
          Mi Cuenta
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Modifica tu nombre o contraseña. Completa solo los campos que deseas cambiar.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Nuevo nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoComplete="name"
          inputProps={{ maxLength: 100 }}
        />

        <TextField
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          autoComplete="new-password"
          inputProps={{ minLength: 6 }}
        />

        <TextField
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          autoComplete="new-password"
          error={passwordMismatch}
          helperText={passwordMismatch ? 'Las contraseñas no coinciden.' : ''}
        />

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Button
          type="submit"
          variant="contained"
          disabled={loading || passwordMismatch}
          sx={{ alignSelf: 'flex-start', px: 4 }}
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </Box>
    </Box>
  );
}
