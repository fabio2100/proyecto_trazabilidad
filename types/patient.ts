export interface Patient {
  id: string;
  apellido: string;
  nombre: string;
  material: string;
  edad: string;
  dni: string;
  telefono: string;
  profesionalSolicitante: string;
  obraSocialFamas: string;
  biopsiasPrevias: string;
  diagnostico: string;
}

export interface PatientFormData {
  apellido: string;
  nombre: string;
  material: string;
  edad: string;
  dni: string;
  telefono: string;
  profesionalSolicitante: string;
  obraSocialFamas: string;
  biopsiasPrevias: string;
  diagnostico: string;
}

export const initialPatientFormData: PatientFormData = {
  apellido: '',
  nombre: '',
  material: '',
  edad: '',
  dni: '',
  telefono: '',
  profesionalSolicitante: '',
  obraSocialFamas: '',
  biopsiasPrevias: '',
  diagnostico: '',
};
