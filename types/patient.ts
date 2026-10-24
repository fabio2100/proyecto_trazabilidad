export interface Patient {
  id: string;
  apellido: string;
  nombre: string;
  email: string;
  material: string;
  fechaNacimiento: string;
  dni: string;
  telefono: string;
  profesionalSolicitante: string;
  obraSocialFamas: string;
  tipoMicroscopia?: string;
  biopsiasPrevias: string;
  estudioPrevioFecha?: string | null;
  diagnostico: string;
}

export interface PatientFormData {
  apellido: string;
  nombre: string;
  email: string;
  material: string;
  fechaNacimiento: string;
  dni: string;
  telefono: string;
  profesionalSolicitante: string;
  obraSocialFamas: string;
  tipoMicroscopia: string;
  biopsiasPrevias: string;
  estudioPrevioFecha: string;
  diagnostico: string;
}

export const initialPatientFormData: PatientFormData = {
  apellido: '',
  nombre: '',
  email: '',
  material: '',
  fechaNacimiento: '',
  dni: '',
  telefono: '',
  profesionalSolicitante: '',
  obraSocialFamas: '',
  tipoMicroscopia: '',
  biopsiasPrevias: '',
  estudioPrevioFecha: '',
  diagnostico: '',
};
