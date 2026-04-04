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
  apellido: string;
  nombre: string;
  email: string;
  edad: string;
}
