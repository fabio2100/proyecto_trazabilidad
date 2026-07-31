'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonalInjuryIcon from '@mui/icons-material/PersonalInjury';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '@/hooks/useAuth';

interface PatientRow {
  dni: string;
  nombre: string;
  apellido: string;
  age: number;
  email: string;
  telefono: string | null;
  createdAt: string;
}

interface PatientFormState {
  dni: string;
  nombre: string;
  apellido: string;
  age: string;
  email: string;
  telefono: string;
}

interface DeleteSummary {
  diagnoses: number;
  notasTecnico: number;
  informes: number;
}

const SUPERUSUARIO_ID = 4;

const emptyCreate: PatientFormState = {
  dni: '',
  nombre: '',
  apellido: '',
  age: '',
  email: '',
  telefono: '',
};

export default function PacientesAdminPage() {
  const PAGE_FETCH_SIZE = 25;
  const { perfilId, isAuthLoading } = useAuth();

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editDni, setEditDni] = useState('');
  const [editForm, setEditForm] = useState<Omit<PatientFormState, 'dni'>>({
    nombre: '',
    apellido: '',
    age: '',
    email: '',
    telefono: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PatientFormState>(emptyCreate);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [deleteLoadingDni, setDeleteLoadingDni] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PatientRow | null>(null);
  const [deleteSummary, setDeleteSummary] = useState<DeleteSummary | null>(null);
  const [deleteSummaryLoading, setDeleteSummaryLoading] = useState(false);
  const [deleteSummaryError, setDeleteSummaryError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPatients = useCallback(async (append = false, offsetOverride = 0, searchOverride = '') => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setPageError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_FETCH_SIZE),
        offset: String(append ? offsetOverride : 0),
      });
      if (searchOverride) {
        params.set('q', searchOverride);
      }
      const res = await fetch(`/api/admin/patients?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        setPageError('Error al cargar los pacientes.');
        return;
      }
      const data = (await res.json()) as { patients: PatientRow[]; hasMore?: boolean };
      setPatients((prev) => (append ? [...prev, ...data.patients] : data.patients));
      setHasMore(data.hasMore === true);
    } catch {
      setPageError('Error de conexión.');
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (perfilId !== SUPERUSUARIO_ID) {
      setLoading(false);
      setPageError('No autorizado para gestionar pacientes.');
      return;
    }
  }, [isAuthLoading, perfilId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (isAuthLoading || perfilId !== SUPERUSUARIO_ID) return;

    void fetchPatients(false, 0, debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchPatients, isAuthLoading, perfilId]);

  const openEdit = (patient: PatientRow) => {
    setEditDni(patient.dni);
    setEditForm({
      nombre: patient.nombre,
      apellido: patient.apellido,
      age: String(patient.age),
      email: patient.email,
      telefono: patient.telefono ?? '',
    });
    setEditError(null);
    setEditSuccess(null);
    setEditOpen(true);
  };

  const handleCreateChange = (field: keyof PatientFormState, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const validatePatientForm = (form: PatientFormState | Omit<PatientFormState, 'dni'>): string | null => {
    const ageNumber = Number((form as { age: string }).age);
    const email = (form as { email: string }).email.trim();

    if (
      !(form as { nombre: string }).nombre.trim() ||
      !(form as { apellido: string }).apellido.trim() ||
      !(form as { age: string }).age.trim() ||
      !email
    ) {
      return 'Nombre, apellido, edad y email son requeridos.';
    }

    if (!Number.isInteger(ageNumber) || ageNumber <= 0) {
      return 'La edad debe ser un número válido.';
    }

    if (!email.includes('@')) {
      return 'Email inválido.';
    }

    return null;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!createForm.dni.trim()) {
      setCreateError('El DNI es requerido.');
      return;
    }

    const validationError = validatePatientForm(createForm);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dni: createForm.dni.trim(),
          nombre: createForm.nombre.trim(),
          apellido: createForm.apellido.trim(),
          age: Number(createForm.age),
          email: createForm.email.trim().toLowerCase(),
          telefono: createForm.telefono.trim() || null,
        }),
      });
      const data = (await res.json()) as { success: boolean; message: string };
      if (!res.ok || !data.success) {
        setCreateError(data.message ?? 'Error al crear paciente.');
        return;
      }
      setCreateSuccess('Paciente creado correctamente.');
      setCreateForm(emptyCreate);
      await fetchPatients(false);
    } catch {
      setCreateError('Error de conexión.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    const validationError = validatePatientForm(editForm);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch('/api/admin/patients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dni: editDni,
          nombre: editForm.nombre.trim(),
          apellido: editForm.apellido.trim(),
          age: Number(editForm.age),
          email: editForm.email.trim().toLowerCase(),
          telefono: editForm.telefono.trim() || null,
        }),
      });
      const data = (await res.json()) as { success: boolean; message: string };
      if (!res.ok || !data.success) {
        setEditError(data.message ?? 'Error al actualizar paciente.');
        return;
      }
      setEditSuccess('Paciente actualizado correctamente.');
      await fetchPatients(false);
    } catch {
      setEditError('Error de conexión.');
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteDialog = async (patient: PatientRow) => {
    setDeleteTarget(patient);
    setDeleteDialogOpen(true);
    setDeleteSummary(null);
    setDeleteSummaryError(null);
    setDeleteSummaryLoading(true);

    try {
      const res = await fetch(`/api/admin/patients?dni=${encodeURIComponent(patient.dni)}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        summary?: DeleteSummary;
      };

      if (!res.ok || !data.success || !data.summary) {
        setDeleteSummaryError(data.message ?? 'No se pudo obtener el resumen de eliminación.');
        return;
      }

      setDeleteSummary(data.summary);
    } catch {
      setDeleteSummaryError('Error de conexión al obtener el resumen de eliminación.');
    } finally {
      setDeleteSummaryLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setPageError(null);
    setDeleteLoadingDni(deleteTarget.dni);
    try {
      const res = await fetch(`/api/admin/patients?dni=${encodeURIComponent(deleteTarget.dni)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = (await res.json()) as { success: boolean; message: string };
      if (!res.ok || !data.success) {
        setPageError(data.message ?? 'Error al eliminar paciente.');
        return;
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setDeleteSummary(null);
      await fetchPatients(false);
    } catch {
      setPageError('Error de conexión al eliminar.');
    } finally {
      setDeleteLoadingDni(null);
    }
  };

  const filteredPatients = patients;

  const paginatedPatients = filteredPatients.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box sx={{ px: 3, py: 4, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <PersonalInjuryIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={600}>
          Crear o editar paciente
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Gestiona pacientes del sistema. Puedes crear, editar o eliminar registros.
      </Typography>

      {pageError && <Alert severity="error" sx={{ mb: 2 }}>{pageError}</Alert>}

      <TextField
        placeholder="Busca sobre la tabla"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mb: 3 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>DNI</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Edad</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Creado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Cargando...</TableCell>
              </TableRow>
            ) : filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No hay pacientes.</TableCell>
              </TableRow>
            ) : (
              paginatedPatients.map((patient) => (
                <TableRow key={patient.dni} hover>
                  <TableCell>{patient.dni}</TableCell>
                  <TableCell>{patient.nombre}</TableCell>
                  <TableCell>{patient.apellido}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>{patient.telefono ?? '—'}</TableCell>
                  <TableCell>{new Date(patient.createdAt).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(patient)} title="Editar paciente">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => void openDeleteDialog(patient)}
                      title="Eliminar paciente"
                      disabled={deleteLoadingDni === patient.dni}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && patients.length > 0 && (
        <>
          <TablePagination
            component="div"
            count={filteredPatients.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Filas por página"
          />
          {hasMore && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button variant="outlined" onClick={() => void fetchPatients(true, patients.length, debouncedSearchTerm)} disabled={loadingMore}>
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </Button>
            </Box>
          )}
        </>
      )}

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
          Crear paciente
        </Button>
      </Box>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar paciente</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
            <TextField label="DNI" value={editDni} fullWidth disabled />
            <TextField
              label="Nombre"
              value={editForm.nombre}
              onChange={(e) => handleEditChange('nombre', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Apellido"
              value={editForm.apellido}
              onChange={(e) => handleEditChange('apellido', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Edad"
              type="number"
              value={editForm.age}
              onChange={(e) => handleEditChange('age', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => handleEditChange('email', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Teléfono"
              value={editForm.telefono}
              onChange={(e) => handleEditChange('telefono', e.target.value)}
              fullWidth
            />
            {editError && <Alert severity="error">{editError}</Alert>}
            {editSuccess && <Alert severity="success">{editSuccess}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={editLoading}>
              {editLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear paciente</DialogTitle>
        <Box component="form" onSubmit={handleCreateSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
            <TextField
              label="DNI"
              value={createForm.dni}
              onChange={(e) => handleCreateChange('dni', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Nombre"
              value={createForm.nombre}
              onChange={(e) => handleCreateChange('nombre', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Apellido"
              value={createForm.apellido}
              onChange={(e) => handleCreateChange('apellido', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Edad"
              type="number"
              value={createForm.age}
              onChange={(e) => handleCreateChange('age', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => handleCreateChange('email', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Teléfono"
              value={createForm.telefono}
              onChange={(e) => handleCreateChange('telefono', e.target.value)}
              fullWidth
            />
            {createError && <Alert severity="error">{createError}</Alert>}
            {createSuccess && <Alert severity="success">{createSuccess}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={createLoading}>
              {createLoading ? 'Creando...' : 'Crear paciente'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (deleteLoadingDni) return;
          setDeleteDialogOpen(false);
          setDeleteTarget(null);
          setDeleteSummary(null);
          setDeleteSummaryError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          {deleteSummaryLoading && (
            <Typography variant="body2">Cargando resumen de eliminación...</Typography>
          )}

          {!deleteSummaryLoading && deleteSummaryError && (
            <Alert severity="error">{deleteSummaryError}</Alert>
          )}

          {!deleteSummaryLoading && !deleteSummaryError && deleteSummary && (
            <Typography variant="body1">
              El usuario se eliminará definitivamente, incluyendo sus {deleteSummary.diagnoses} diagnósticos, {deleteSummary.notasTecnico} notas del técnico y {deleteSummary.informes} informes. Esta acción es irreversible.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteTarget(null);
              setDeleteSummary(null);
              setDeleteSummaryError(null);
            }}
            disabled={!!deleteLoadingDni}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleDelete()}
            disabled={!deleteSummary || !!deleteSummaryError || deleteSummaryLoading || !!deleteLoadingDni}
          >
            {deleteLoadingDni ? 'Eliminando...' : 'Aceptar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}