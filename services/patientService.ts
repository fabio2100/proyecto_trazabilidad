import { CreatePatientDto } from '@/types/patient.dto';
import { Patient } from '@/types/patient';
// Nota: `createPatient` ahora llama al endpoint real `/api/guardar_paciente`.

// Cambiar a false cuando el endpoint real esté disponible
const USE_MOCK = true;

// Ajustar esta ruta según el endpoint real del backend
const PATIENTS_ENDPOINT = '/patients';

const STORAGE_KEY = 'patients';

const isBrowser = (): boolean => typeof window !== 'undefined';

const readPatientsFromStorage = (): Patient[] => {
  if (!isBrowser()) {
    return [];
  }

  const rawPatients = localStorage.getItem(STORAGE_KEY);
  if (!rawPatients) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawPatients) as Patient[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const savePatientsToStorage = (patients: Patient[]): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
};

const mapCreateDtoToPatient = (id: string, data: CreatePatientDto): Patient => {
  return {
    id,
    apellido: data.apellido,
    nombre: data.nombre,
    email: data.email,
    material: data.material,
    edad: data.edad,
    dni: data.dni,
    telefono: data.telefono,
    profesionalSolicitante: data.profesionalSolicitante,
    obraSocialFamas: data.obraSocialFamas,
    biopsiasPrevias: data.biopsiasPrevias,
    diagnostico: data.diagnostico,
  };
};

export const createPatient = async (data: CreatePatientDto): Promise<void> => {
  try {
    const response = await fetch('/api/guardar_paciente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    let respData: any = null;
    try {
      respData = await response.json();
    } catch {
      respData = null;
    }

    if (!response.ok || (respData && respData.ok === false)) {
      const msg = respData && respData.message ? String(respData.message) : 'No se pudo crear el paciente. Por favor, intentá de nuevo.';
      throw new Error(msg);
    }

    return;
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'message' in err ? (err as any).message : 'No se pudo crear el paciente. Por favor, intentá de nuevo.';
    throw new Error(message as string);
  }
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const patients = readPatientsFromStorage();
        const patient = patients.find((item) => item.id === id) ?? null;
        resolve(patient);
      }, 150);
    });
  }

  // TODO: Implementar API real (ej: GET /patients/:id)
  throw new Error('getPatientById no está implementado para modo API real todavía.');
};

export const updatePatient = async (id: string, data: CreatePatientDto): Promise<void> => {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const patients = readPatientsFromStorage();
        const index = patients.findIndex((item) => item.id === id);

        if (index === -1) {
          reject(new Error('Paciente no encontrado para actualizar.'));
          return;
        }

        const updatedPatient = mapCreateDtoToPatient(id, data);
        const nextPatients = [...patients];
        nextPatients[index] = updatedPatient;
        savePatientsToStorage(nextPatients);
        resolve();
      }, 200);
    });
  }

  // TODO: Implementar API real (ej: PUT /patients/:id)
  throw new Error('updatePatient no está implementado para modo API real todavía.');
};
