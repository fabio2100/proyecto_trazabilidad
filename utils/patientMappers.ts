import { PatientFormData } from '@/types/patient';
import { CreatePatientDto } from '@/types/patient.dto';

export const mapPatientFormDataToCreateDto = (
  data: PatientFormData,
): CreatePatientDto => {
  return {
    apellido: data.apellido,
    nombre: data.nombre,
    email: data.email,
    material: data.material,
    edad: data.edad,
    dni: data.dni,
    telefono: data.telefono,
    profesionalSolicitante: data.profesionalSolicitante,
    obraSocialFamas: data.obraSocialFamas,
    biopsiasPrevias: data.biopsiasPrevias,
    estudioPrevioFecha:
      data.biopsiasPrevias === 'Si'
        ? data.estudioPrevioFecha
        : '',
    diagnostico: data.diagnostico,
  };
};