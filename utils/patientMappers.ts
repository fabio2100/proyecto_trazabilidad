import { PatientFormData } from '@/types/patient';
import { CreatePatientDto } from '@/types/patient.dto';

export const mapPatientFormDataToCreateDto = (data: PatientFormData): CreatePatientDto => {
  return {
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
