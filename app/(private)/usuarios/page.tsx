'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  validated: boolean;
  createdAt: string;
  perfilId: number;
  perfilTipo: string;
}

interface Perfil {
  id: number;
  tipo: string;
}

const SUPERUSUARIO_ID = 4;

const emptyCreate = { email: '', name: '', password: '', confirmPassword: '', perfilId: '' };

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editPerfilId, setEditPerfilId] = useState<number | ''>('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) {
        setPageError('Error al cargar los usuarios.');
        return;
      }
      const data = (await res.json()) as { users: UserRow[] };
      setUsers(data.users);
    } catch {
      setPageError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();

    fetch('/api/getPerfiles', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { perfiles: Perfil[] }) => {
        setPerfiles(data.perfiles.filter((p) => p.id !== SUPERUSUARIO_ID));
      })
      .catch(() => null);
  }, [fetchUsers]);

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setEditName(user.name ?? '');
    setEditPassword('');
    setEditConfirmPassword('');
    setEditPerfilId(user.perfilId);
    setEditError(null);
    setEditSuccess(null);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    if (editPassword && editPassword !== editConfirmPassword) {
      setEditError('Las contraseñas no coinciden.');
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setEditError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const body: Record<string, unknown> = { id: editUser!.id };
    body.name = editName;
    if (editPassword) body.password = editPassword;
    if (editPerfilId !== '') body.perfilId = editPerfilId;

    setEditLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { success: boolean; message: string };
      if (!res.ok || !data.success) {
        setEditError(data.message ?? 'Error al actualizar.');
        return;
      }
      setEditSuccess('Usuario actualizado correctamente.');
      await fetchUsers();
    } catch {
      setEditError('Error de conexión.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreateChange = (field: keyof typeof emptyCreate, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!createForm.email || !createForm.password || !createForm.perfilId) {
      setCreateError('Email, contraseña y perfil son requeridos.');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      setCreateError('Las contraseñas no coinciden.');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: createForm.email,
          name: createForm.name || undefined,
          password: createForm.password,
          perfilId: Number(createForm.perfilId),
        }),
      });
      const data = (await res.json()) as { success: boolean; message: string };
      if (!res.ok || !data.success) {
        setCreateError(data.message ?? 'Error al crear usuario.');
        return;
      }
      setCreateSuccess('Usuario creado correctamente.');
      setCreateForm(emptyCreate);
      await fetchUsers();
    } catch {
      setCreateError('Error de conexión.');
    } finally {
      setCreateLoading(false);
    }
  };

  const editPasswordMismatch =
    editPassword.length > 0 && editConfirmPassword.length > 0 && editPassword !== editConfirmPassword;
  const createPasswordMismatch =
    createForm.password.length > 0 &&
    createForm.confirmPassword.length > 0 &&
    createForm.password !== createForm.confirmPassword;

  return (
    <Box sx={{ px: 3, py: 4, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <ManageAccountsIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={600}>
          Crear o editar usuario
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Gestiona los usuarios del sistema. Puedes editar sus datos o crear uno nuevo.
      </Typography>

      {pageError && <Alert severity="error" sx={{ mb: 2 }}>{pageError}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Validado</TableCell>
              <TableCell>Creado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Cargando...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay usuarios.</TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.name ?? '—'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={u.perfilTipo} size="small" />
                  </TableCell>
                  <TableCell>{u.validated ? 'Sí' : 'No'}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(u)} title="Editar usuario">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => {
            setCreateForm(emptyCreate);
            setCreateError(null);
            setCreateSuccess(null);
            setCreateOpen(true);
          }}
        >
          Crear usuario
        </Button>
      </Box>

      {/* ── Edit Modal ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar usuario</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
            <TextField
              label="Nombre"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <FormControl fullWidth>
              <InputLabel>Perfil</InputLabel>
              <Select
                value={editPerfilId}
                label="Perfil"
                onChange={(e) => setEditPerfilId(e.target.value as number)}
              >
                {perfiles.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Nueva contraseña"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
              helperText="Dejar en blanco para no cambiar"
            />
            <TextField
              label="Confirmar contraseña"
              type="password"
              value={editConfirmPassword}
              onChange={(e) => setEditConfirmPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
              error={editPasswordMismatch}
              helperText={editPasswordMismatch ? 'Las contraseñas no coinciden.' : ''}
            />
            {editError && <Alert severity="error">{editError}</Alert>}
            {editSuccess && <Alert severity="success">{editSuccess}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editLoading || editPasswordMismatch}
            >
              {editLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ── Create Modal ── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear usuario</DialogTitle>
        <Box component="form" onSubmit={handleCreateSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => handleCreateChange('email', e.target.value)}
              fullWidth
              required
              autoComplete="off"
            />
            <TextField
              label="Nombre"
              value={createForm.name}
              onChange={(e) => handleCreateChange('name', e.target.value)}
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <FormControl fullWidth required>
              <InputLabel>Perfil</InputLabel>
              <Select
                value={createForm.perfilId}
                label="Perfil"
                onChange={(e) => handleCreateChange('perfilId', String(e.target.value))}
              >
                {perfiles.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Contraseña"
              type="password"
              value={createForm.password}
              onChange={(e) => handleCreateChange('password', e.target.value)}
              fullWidth
              required
              autoComplete="new-password"
            />
            <TextField
              label="Confirmar contraseña"
              type="password"
              value={createForm.confirmPassword}
              onChange={(e) => handleCreateChange('confirmPassword', e.target.value)}
              fullWidth
              required
              autoComplete="new-password"
              error={createPasswordMismatch}
              helperText={createPasswordMismatch ? 'Las contraseñas no coinciden.' : ''}
            />
            {createError && <Alert severity="error">{createError}</Alert>}
            {createSuccess && <Alert severity="success">{createSuccess}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createLoading || createPasswordMismatch}
            >
              {createLoading ? 'Creando...' : 'Crear usuario'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
