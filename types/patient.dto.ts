export interface CreatePatientDto {
  apellido: string;
  nombre: string;
  email: string;
  material: string;
  fechaNacimiento: string;
  dni: string;
  telefono: string;
  profesionalSolicitante: string;
  obraSocialFamas: string;
  biopsiasPrevias: string;
  estudioPrevioFecha: string;
  diagnostico: string;
}

export interface PatientDataByDniDto {
  dni?: string;
  apellido: string;
  nombre: string;
  email: string;
  fechaNacimiento: string;
  telefono?: string;
}

export interface GuardarPacienteDto {
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  email: string;
  telefono: string;
  diagnostico: string;
  material: string;
  profesionalSolicitante: string;
  obraSocialFamas: string;
  biopsiasPrevias: string;
  estudioPrevioFecha?: string;
}