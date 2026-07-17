import {
  CreatePatientDto,
  GuardarPacienteDto,
  PatientDataByDniDto,
} from '@/types/patient.dto';
import { Patient } from '@/types/patient';

/*
 * Se mantiene en true porque las operaciones de consulta, actualización
 * y eliminación todavía utilizan localStorage.
 *
 * La creación real del diagnóstico se realiza mediante guardarPaciente(),
 * que llama directamente a /api/guardar_paciente.
 */
const USE_MOCK = true;

const STORAGE_KEY = 'patients';

interface GetPatientDataResponse {
  ok: boolean;
  patient: PatientDataByDniDto | null;
  message?: string;
}

interface CreatePatientResponse {
  ok: boolean;
  message?: string;
}

interface GuardarPacienteResponse {
  ok: boolean;
  message?: string;
  diagnosisId?: string;
  sampleCode?: string;
}

interface GuardarPacienteResult {
  diagnosisId: string;
  sampleCode: string;
}

const isBrowser = (): boolean => typeof window !== 'undefined';

const getErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

const normalizeEstudioPrevioFecha = (
  biopsiasPrevias: string,
  estudioPrevioFecha?: string,
): string => {
  return biopsiasPrevias === 'Si'
    ? estudioPrevioFecha?.trim() ?? ''
    : '';
};

const readPatientsFromStorage = (): Patient[] => {
  if (!isBrowser()) {
    return [];
  }

  const rawPatients = localStorage.getItem(STORAGE_KEY);

  if (!rawPatients) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawPatients);

    return Array.isArray(parsed)
      ? (parsed as Patient[])
      : [];
  } catch {
    return [];
  }
};

const savePatientsToStorage = (
  patients: Patient[],
): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(patients),
  );
};

const mapCreateDtoToPatient = (
  id: string,
  data: CreatePatientDto,
): Patient => {
  return {
    id,
    apellido: data.apellido,
    nombre: data.nombre,
    email: data.email,
    material: data.material,
    edad: data.edad,
    dni: data.dni,
    telefono: data.telefono,
    profesionalSolicitante:
      data.profesionalSolicitante,
    obraSocialFamas: data.obraSocialFamas,
    biopsiasPrevias: data.biopsiasPrevias,
    estudioPrevioFecha:
      normalizeEstudioPrevioFecha(
        data.biopsiasPrevias,
        data.estudioPrevioFecha,
      ),
    diagnostico: data.diagnostico,
  };
};

export const createPatient = async (
  data: CreatePatientDto,
): Promise<void> => {
  const normalizedData: CreatePatientDto = {
    ...data,
    estudioPrevioFecha:
      normalizeEstudioPrevioFecha(
        data.biopsiasPrevias,
        data.estudioPrevioFecha,
      ),
  };

  try {
    const response = await fetch(
      '/api/guardar_paciente',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedData),
      },
    );

    const payload = (await response
      .json()
      .catch(() => null)) as
      | CreatePatientResponse
      | null;

    if (
      !response.ok ||
      payload?.ok === false
    ) {
      throw new Error(
        payload?.message ??
          'No se pudo crear el paciente. Por favor, intentá de nuevo.',
      );
    }
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo crear el paciente. Por favor, intentá de nuevo.',
      ),
    );
  }
};

export const getPatientById = async (
  id: string,
): Promise<Patient | null> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const patients =
          readPatientsFromStorage();

        const patient =
          patients.find(
            (item) => item.id === id,
          ) ?? null;

        resolve(patient);
      }, 150);
    });
  }

  throw new Error(
    'getPatientById no está implementado para modo API real todavía.',
  );
};

export const updatePatient = async (
  id: string,
  data: CreatePatientDto,
): Promise<void> => {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const patients =
          readPatientsFromStorage();

        const index = patients.findIndex(
          (item) => item.id === id,
        );

        if (index === -1) {
          reject(
            new Error(
              'Paciente no encontrado para actualizar.',
            ),
          );
          return;
        }

        const updatedPatient =
          mapCreateDtoToPatient(id, data);

        const nextPatients = [...patients];
        nextPatients[index] = updatedPatient;

        savePatientsToStorage(nextPatients);
        resolve();
      }, 200);
    });
  }

  throw new Error(
    'updatePatient no está implementado para modo API real todavía.',
  );
};

export const deletePatient = async (
  id: string,
): Promise<void> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const patients =
          readPatientsFromStorage();

        const nextPatients = patients.filter(
          (item) => item.id !== id,
        );

        savePatientsToStorage(nextPatients);
        resolve();
      }, 200);
    });
  }

  throw new Error(
    'deletePatient no está implementado para modo API real todavía.',
  );
};

export const getPatientDataByDni = async (
  dni: string,
): Promise<PatientDataByDniDto | null> => {
  const response = await fetch(
    `/api/getPatientData?dni=${encodeURIComponent(dni)}`,
  );

  const payload = (await response
    .json()
    .catch(() => null)) as
    | GetPatientDataResponse
    | null;

  if (!response.ok || payload?.ok === false) {
    throw new Error(
      payload?.message ??
        'No se pudo consultar el paciente por DNI.',
    );
  }

  return payload?.patient ?? null;
};

export const getPatientDataByEmail = async (
  email: string,
): Promise<PatientDataByDniDto | null> => {
  const response = await fetch(
    `/api/getPatientData?email=${encodeURIComponent(email)}`,
  );

  const payload = (await response
    .json()
    .catch(() => null)) as
    | GetPatientDataResponse
    | null;

  if (!response.ok || payload?.ok === false) {
    throw new Error(
      payload?.message ??
        'No se pudo consultar el paciente por email.',
    );
  }

  return payload?.patient ?? null;
};

export const guardarPaciente = async (
  data: GuardarPacienteDto,
): Promise<GuardarPacienteResult> => {
  /*
   * Aunque el formulario ya limpia la fecha al seleccionar "No",
   * el servicio vuelve a normalizarla para no enviar datos residuales.
   */
  const normalizedData: GuardarPacienteDto = {
    ...data,
    estudioPrevioFecha:
      normalizeEstudioPrevioFecha(
        data.biopsiasPrevias,
        data.estudioPrevioFecha,
      ),
  };

  const response = await fetch(
    '/api/guardar_paciente',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalizedData),
    },
  );

  const payload = (await response
    .json()
    .catch(() => null)) as
    | GuardarPacienteResponse
    | null;

  if (
    !response.ok ||
    payload?.ok === false
  ) {
    throw new Error(
      payload?.message ??
        'No se pudo guardar el paciente.',
    );
  }

  if (!payload?.diagnosisId) {
    throw new Error(
      'No se recibió el ID del diagnóstico creado.',
    );
  }

  if (!payload.sampleCode) {
    throw new Error(
      'No se recibió el código de muestra del diagnóstico creado.',
    );
  }

  return {
    diagnosisId: payload.diagnosisId,
    sampleCode: payload.sampleCode,
  };
};