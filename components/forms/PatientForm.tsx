'use client';

import { useEffect, useState } from 'react';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { PatientFormData, initialPatientFormData } from '@/types/patient';
import {
  validateTextField,
  validateEdad,
  validateDni,
  validateTelefono,
  validateSelect,
} from '@/utils/validations';
import { mapPatientFormDataToCreateDto } from '@/utils/patientMappers';
import { createPatient, getPatientDataByDni, updatePatient } from '@/services/patientService';

type ValidatableFieldName = keyof PatientFormData;

interface FormErrors {
  apellido?: string;
  nombre?: string;
  material?: string;
  edad?: string;
  dni?: string;
  telefono?: string;
  profesionalSolicitante?: string;
  obraSocialFamas?: string;
  biopsiasPrevias?: string;
  diagnostico?: string;
}

interface FormTouched {
  apellido?: boolean;
  nombre?: boolean;
  material?: boolean;
  edad?: boolean;
  dni?: boolean;
  telefono?: boolean;
  profesionalSolicitante?: boolean;
  obraSocialFamas?: boolean;
  biopsiasPrevias?: boolean;
  diagnostico?: boolean;
}

interface PatientFormProps {
  initialData?: PatientFormData;
  mode?: 'create' | 'edit';
  patientId?: string;
}

export default function PatientForm({ initialData, mode = 'create', patientId }: PatientFormProps) {
  const resolvedInitialData = mode === 'edit' && initialData ? initialData : initialPatientFormData;

  const [formData, setFormData] = useState<PatientFormData>(resolvedInitialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    setFormData(resolvedInitialData);
    setErrors({});
    setTouched({});
    setSuccessMessage('');
    setErrorMessage('');
    setEmail('');
  }, [resolvedInitialData]);

  const fetchPatientDataByDni = async (dni: string): Promise<void> => {
    try {
      const patientData = await getPatientDataByDni(dni);

      if (!patientData) {
        setEmail('');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        apellido: patientData.apellido,
        nombre: patientData.nombre,
        edad: patientData.edad,
      }));

      setErrors((prev) => ({
        ...prev,
        apellido: '',
        nombre: '',
        edad: '',
      }));

      setEmail(patientData.email);
    } catch {
      setEmail('');
      setErrorMessage('No se pudieron obtener los datos del paciente por DNI.');
    }
  };

  const validateField = (fieldName: ValidatableFieldName, value: string): string => {
    let error = '';

    switch (fieldName) {
      case 'apellido':
        error = validateTextField(value, 'Apellido');
        break;
      case 'nombre':
        error = validateTextField(value, 'Nombre');
        break;
      case 'material':
        error = validateTextField(value, 'Material');
        break;
      case 'edad':
        error = validateEdad(value);
        break;
      case 'dni':
        error = validateDni(value);
        break;
      case 'telefono':
        error = validateTelefono(value);
        break;
      case 'profesionalSolicitante':
        error = validateTextField(value, 'Profesional Solicitante');
        break;
      case 'obraSocialFamas':
        error = validateTextField(value, 'Obra Social FAMAS');
        break;
      case 'biopsiasPrevias':
        error = validateSelect(value, 'Biopsias Previas');
        break;
      case 'diagnostico':
        // El diagnóstico es opcional, no validar
        break;
      default:
        const exhaustiveCheck: never = fieldName;
        return exhaustiveCheck;
    }

    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldName = name as ValidatableFieldName;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    const fieldError = validateField(fieldName, value);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: fieldError,
    }));

    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    const fieldName = name as ValidatableFieldName;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    const fieldError = validateField(fieldName, value);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: fieldError,
    }));

    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldName = name as ValidatableFieldName;

    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));

    if (mode !== 'create' || fieldName !== 'dni') {
      return;
    }

    const dniValue = value.trim();
    const dniError = validateDni(dniValue);

    if (dniError) {
      setEmail('');
      return;
    }

    setErrorMessage('');
    void fetchPatientDataByDni(dniValue);
  };

  const requiredFields: Array<ValidatableFieldName> = [
    'apellido',
    'nombre',
    'material',
    'edad',
    'dni',
    'telefono',
    'profesionalSolicitante',
    'obraSocialFamas',
    'biopsiasPrevias',
  ];

  const hasValidationErrors = (): boolean => {
    return Object.values(errors).some((error) => error !== '');
  };

  const hasMissingRequiredFields = (): boolean => {
    return requiredFields.some((fieldName) => !formData[fieldName]?.trim());
  };

  const isFormValid = (): boolean => {
    return !hasValidationErrors() && !hasMissingRequiredFields();
  };

  const showError = (fieldName: ValidatableFieldName): boolean => {
    return !!(touched[fieldName] && errors[fieldName]);
  };

  const handleCancel = () => {
    setFormData(resolvedInitialData);
    setErrors({});
    setTouched({});
    setSuccessMessage('');
    setErrorMessage('');
    setEmail('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Marcar todos los campos como tocados para mostrar errores
    const allTouched: FormTouched = requiredFields.reduce(
      (acc, fieldName) => ({
        ...acc,
        [fieldName]: true,
      }),
      {}
    );
    setTouched(allTouched);

    if (!isFormValid()) {
      return;
    }

    setSuccessMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const dto = mapPatientFormDataToCreateDto(formData);

      if (mode === 'edit') {
        if (!patientId) {
          throw new Error('No se pudo actualizar: falta el identificador del paciente.');
        }

        await updatePatient(patientId, dto);
        setSuccessMessage('Paciente actualizado correctamente.');
      } else {
        await createPatient(dto);
        setFormData(initialPatientFormData);
        setErrors({});
        setTouched({});
        setEmail('');
        setSuccessMessage('Paciente guardado correctamente.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ocurrió un error al guardar el paciente.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h2" component="h2" gutterBottom sx={{ mb: 3 }}>
          {mode === 'edit' ? 'Editar Paciente' : 'Nuevo Paciente'}
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          {/* Apellido */}
          <Box>
            <TextField
              fullWidth
              label="Apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ingrese apellido del paciente"
              error={showError('apellido')}
              helperText={showError('apellido') ? errors.apellido : ''}
            />
          </Box>

          {/* Nombre */}
          <Box>
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ingrese nombre del paciente"
              error={showError('nombre')}
              helperText={showError('nombre') ? errors.nombre : ''}
            />
          </Box>

          {/* Material */}
          <Box>
            <TextField
              fullWidth
              label="Material"
              name="material"
              value={formData.material}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Tipo de material"
              error={showError('material')}
              helperText={showError('material') ? errors.material : ''}
            />
          </Box>

          {/* Edad */}
          <Box>
            <TextField
              fullWidth
              label="Edad"
              name="edad"
              type="text"
              value={formData.edad}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Edad del paciente"
              error={showError('edad')}
              helperText={showError('edad') ? errors.edad : ''}
            />
          </Box>

          {/* Email */}
          <Box>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={email}
              placeholder="Se completa automáticamente según DNI"
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />
          </Box>

          {/* DNI */}
          <Box>
            <TextField
              fullWidth
              label="DNI"
              name="dni"
              type="text"
              value={formData.dni}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Número de DNI"
              error={showError('dni')}
              helperText={showError('dni') ? errors.dni : ''}
            />
          </Box>

          {/* Teléfono */}
          <Box>
            <TextField
              fullWidth
              label="Teléfono"
              name="telefono"
              type="text"
              value={formData.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Número de teléfono"
              error={showError('telefono')}
              helperText={showError('telefono') ? errors.telefono : ''}
            />
          </Box>

          {/* Profesional Solicitante */}
          <Box>
            <TextField
              fullWidth
              label="Profesional Solicitante"
              name="profesionalSolicitante"
              value={formData.profesionalSolicitante}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Nombre del profesional"
              error={showError('profesionalSolicitante')}
              helperText={showError('profesionalSolicitante') ? errors.profesionalSolicitante : ''}
            />
          </Box>

          {/* Obra Social FAMAS */}
          <Box>
            <TextField
              fullWidth
              label="Obra Social FAMAS"
              name="obraSocialFamas"
              value={formData.obraSocialFamas}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Obra social o datos FAMAS"
              error={showError('obraSocialFamas')}
              helperText={showError('obraSocialFamas') ? errors.obraSocialFamas : ''}
            />
          </Box>

          {/* Biopsias Previas - FormControl con InputLabel y FormHelperText */}
          <Box>
            <FormControl fullWidth error={showError('biopsiasPrevias')}>
              <InputLabel id="biopsias-label">Biopsias Previas</InputLabel>
              <Select
                labelId="biopsias-label"
                id="biopsias-select"
                name="biopsiasPrevias"
                value={formData.biopsiasPrevias}
                onChange={handleSelectChange}
                onBlur={handleBlur}
                label="Biopsias Previas"
              >
                <MenuItem value="">Seleccione opción</MenuItem>
                <MenuItem value="Si">Sí</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
              {showError('biopsiasPrevias') && (
                <FormHelperText>{errors.biopsiasPrevias}</FormHelperText>
              )}
            </FormControl>
          </Box>

          {/* Diagnóstico - ocupa toda la fila */}
          <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
            <TextField
              fullWidth
              label="Diagnóstico"
              name="diagnostico"
              value={formData.diagnostico}
              onChange={handleChange}
              placeholder="Diagnóstico clínico o observaciones"
              multiline
              rows={3}
            />
          </Box>

          {/* Botones de acción - ocupa toda la fila */}
          <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' }, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="secondary" disabled={isSubmitting} onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Actualizar Paciente' : 'Guardar Paciente'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
