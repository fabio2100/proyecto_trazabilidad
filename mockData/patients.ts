import { Patient } from '../types/patient';

export const patients: Patient[] = [
  {
    id: '1',
    apellido: 'Pérez',
    nombre: 'Juan',
    material: 'Biopsia hepática',
    edad: '30',
    dni: '12345678',
    telefono: '1122233344',
    profesionalSolicitante: 'Dr. López',
    obraSocialFamas: 'OSDE',
    biopsiasPrevias: 'No',
    diagnostico: 'Hepatitis crónica',
  },
  {
    id: '2',
    apellido: 'García',
    nombre: 'María',
    material: 'Biopsia renal',
    edad: '25',
    dni: '87654321',
    telefono: '1144455566',
    profesionalSolicitante: 'Dra. Silva',
    obraSocialFamas: 'PAMI',
    biopsiasPrevias: 'Sí',
    diagnostico: 'Insuficiencia renal',
  },
];