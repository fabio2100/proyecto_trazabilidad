export interface Patient {
  id: string;
  apellido: string;
  nombre: string;
  email: string;
  material: string;
  edad: string;
  dni: string;
  telefono: string;
  profesionalSolicitante: string;
  obraSocialFamas: string;
  biopsiasPrevias: string;
  estudioPrevioFecha: string;
  diagnostico: string;
}

export interface PatientFormData {
  apellido: string;
  nombre: string;
  email: string;
  material: string;
  edad: string;
  dni: string;
  telefono: string;
  profesionalSolicitante: string;
  obraSocialFamas: string;
  biopsiasPrevias: string;
  estudioPrevioFecha: string;
  diagnostico: string;
}

export const initialPatientFormData: PatientFormData = {
  apellido: '',
  nombre: '',
  email: '',
  material: '',
  edad: '',
  dni: '',
  telefono: '',
  profesionalSolicitante: '',
  obraSocialFamas: '',
  biopsiasPrevias: '',
  estudioPrevioFecha: '',
  diagnostico: '',
};
