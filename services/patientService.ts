import { CreatePatientDto, PatientDataByDniDto } from '@/types/patient.dto';
import { Patient } from '@/types/patient';
import { apiPost } from '@/services/apiClient';

// Cambiar a false cuando el endpoint real esté disponible
const USE_MOCK = true;

// Ajustar esta ruta según el endpoint real del backend
const PATIENTS_ENDPOINT = '/patients';

const STORAGE_KEY = 'patients';

interface GetPatientDataResponse {
  ok: boolean;
  patient: PatientDataByDniDto | null;
  message?: string;
}

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
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const patients = readPatientsFromStorage();
        const newPatient = mapCreateDtoToPatient(Date.now().toString(), data);
        savePatientsToStorage([...patients, newPatient]);
        resolve();
      }, 300);
    });
  }

  try {
    await apiPost<CreatePatientDto, unknown>(PATIENTS_ENDPOINT, data);
  } catch {
    throw new Error('No se pudo crear el paciente. Por favor, intentá de nuevo.');
  }
};

export const getPatients = async (): Promise<Patient[]> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(readPatientsFromStorage());
      }, 150);
    });
  }

  // TODO: Implementar API real (ej: GET /patients)
  throw new Error('getPatients no está implementado para modo API real todavía.');
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

export const deletePatient = async (id: string): Promise<void> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const patients = readPatientsFromStorage();
        const nextPatients = patients.filter((item) => item.id !== id);
        savePatientsToStorage(nextPatients);
        resolve();
      }, 200);
    });
  }

  // TODO: Implementar API real (ej: DELETE /patients/:id)
  throw new Error('deletePatient no está implementado para modo API real todavía.');
};

export const getPatientDataByDni = async (dni: string): Promise<PatientDataByDniDto | null> => {
  const response = await fetch(`/api/getPatientData?dni=${encodeURIComponent(dni)}`);

  if (!response.ok) {
    throw new Error('No se pudo consultar el paciente por DNI.');
  }

  const data = (await response.json()) as GetPatientDataResponse;
  return data.patient;
};
