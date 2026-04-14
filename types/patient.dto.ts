export interface CreatePatientDto {
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

export interface PatientDataByDniDto {
  dni?: string;
  apellido: string;
  nombre: string;
  email: string;
  edad: string;
  telefono?: string;
}

export interface GuardarPacienteDto {
  dni: string;
  nombre: string;
  apellido: string;
  edad: string;
  email: string;
  telefono: string;
  diagnostico: string;
  material: string;
  profesionalSolicitante: string;
  biopsiasPrevias: string;
}
