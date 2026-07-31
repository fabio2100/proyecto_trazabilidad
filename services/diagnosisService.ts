/**
 * Tipo que refleja la estructura real devuelta por /api/getPatients
 * Contiene datos de un Diagnosis con referencia a su Informe (si existe)
 */
export interface DiagnosisRecord {
  id: string;                           // ID del Diagnosis
  biopsasPrevias: boolean;              // ¿Hay biopsias previas?
  estudioPrevioFecha: string | null;    // Fecha del estudio previo, si aplica
  created_at: string;                   // Fecha de creación (ISO string)
  diagnosis: string;                    // Descripción del diagnóstico
  material: string;                     // Material analizado
  patientId: string;                    // DNI del paciente
  patientNombre: string | null;
  patientApellido: string | null;
  profesionalSolicitante: string;       // Profesional que solicitó
  sampleCode: string | null;            // Código de muestra asignado al diagnóstico
  hasInforme: boolean;                  // ¿Existe un informe?
  informeId: string | null;             // ID de la tabla Informes (para PDF)
  hasNotasTecnico: boolean;             // ¿Existen notas del técnico?
}

export type Diagnosis = DiagnosisRecord;


interface GetDiagnosesResponse {
  ok: boolean;
  data?: DiagnosisRecord[];
  hasMore?: boolean;
  message?: string;
}

interface GetDiagnosesOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

interface GetDiagnosesResult {
  data: Diagnosis[];
  hasMore: boolean;
}

const USE_MOCK = false; // Usar backend real
const STORAGE_KEY = 'patients';

const isBrowser = (): boolean => typeof window !== 'undefined';

const readDiagnosesFromStorage = (): DiagnosisRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  const rawData = localStorage.getItem(STORAGE_KEY);
  if (!rawData) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawData) as DiagnosisRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveDiagnosesToStorage = (diagnoses: DiagnosisRecord[]): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(diagnoses));
};

export const getDiagnoses = async (
  options: GetDiagnosesOptions = {},
): Promise<GetDiagnosesResult> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: readDiagnosesFromStorage(), hasMore: false });
      }, 150);
    });
  }

  const params = new URLSearchParams();
  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options.offset !== undefined) {
    params.set('offset', String(options.offset));
  }
  if (options.search?.trim()) {
    params.set('q', options.search.trim());
  }

  const queryString = params.toString();
  const response = await fetch(`/api/getPatients${queryString ? `?${queryString}` : ''}`);

  const payload = (await response
    .json()
    .catch(() => null)) as GetDiagnosesResponse | null;

  if (!response.ok || payload?.ok === false) {
    throw new Error(
      payload?.message ??
        `No se pudieron cargar los diagnósticos. HTTP ${response.status}`,
    );
  }

  if (!Array.isArray(payload?.data)) {
    throw new Error('La respuesta de diagnósticos no tiene un formato válido.');
  }

  return { data: payload.data, hasMore: payload.hasMore === true };
};

export const deleteDiagnosis = async (id: string): Promise<void> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const diagnoses = readDiagnosesFromStorage();
        const nextDiagnoses = diagnoses.filter((item) => item.id !== id);
        saveDiagnosesToStorage(nextDiagnoses);
        resolve();
      }, 200);
    });
  }

  throw new Error('deleteDiagnosis no está implementado para modo API real todavía.');
};

export const deleteDiagnosisReal = async (id: string): Promise<void> => {
  const response = await fetch(`/api/deleteDiagnosis?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => null)) as { ok: boolean; message?: string } | null;

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message ?? `Error al eliminar el diagnóstico. HTTP ${response.status}`);
  }
};