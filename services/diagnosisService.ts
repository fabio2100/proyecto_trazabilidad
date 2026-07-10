/**
 * Tipo que refleja la estructura real devuelta por /api/getPatients
 * Contiene datos de un Diagnosis con referencia a su Informe (si existe)
 */
export interface DiagnosisRecord {
  id: string;                           // ID del Diagnosis
  biopsasPrevias: boolean;              // ¿Hay biopsias previas?
  created_at: string;                   // Fecha de creación (ISO string)
  diagnosis: string;                    // Descripción del diagnóstico
  material: string;                     // Material analizado
  patientId: string;                    // DNI del paciente
  patientNombre?: string;
  patientApellido?: string;
  profesionalSolicitante: string;       // Profesional que solicitó
  sampleCode: string | null;            // Código de muestra asignado al diagnóstico
  hasInforme: boolean;                  // ¿Existe un informe?
  informeId: string | null;             // ID de la tabla Informes (para PDF)
}

export type Diagnosis = DiagnosisRecord;

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

export const getDiagnoses = async (): Promise<Diagnosis[]> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(readDiagnosesFromStorage());
      }, 150);
    });
  }

  const response = await fetch('/api/getPatients');

  if (!response.ok) {
    throw new Error('No se pudieron cargar los diagnósticos.');
  }

  const json = await response.json();
  if (!json.ok) {
    throw new Error(json.message || 'Error al obtener los diagnósticos.');
  }

  return json.data as Diagnosis[];
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