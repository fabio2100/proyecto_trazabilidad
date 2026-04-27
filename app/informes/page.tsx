'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface DiagnosisData {
  id: string;
  patientId: string;
  diagnosis: string;
  material: string;
  profesionalSolicitante: string;
  biopsasPrevias: boolean;
  createdAt: string;
}

export default function InformesPage() {
  const searchParams = useSearchParams();
  const diagnosisId = searchParams.get('diagnosisId');

  const [authValid, setAuthValid] = useState<boolean | null>(null);
  const [informe, setInforme] = useState('');
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('auth');
    setAuthValid(auth === 'true');
  }, []);

  useEffect(() => {
    if (!authValid || !diagnosisId) return;

    setLoadingDiagnosis(true);
    fetch(`/api/getDiagnosis?id=${encodeURIComponent(diagnosisId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          setDiagnosisData(json.data);
        } else {
          setDiagnosisError(json.message ?? 'Estudio no encontrado');
        }
      })
      .catch(() => setDiagnosisError('Error al obtener el estudio.'))
      .finally(() => setLoadingDiagnosis(false));
  }, [authValid, diagnosisId]);

  if (authValid === null) {
    return null;
  }

  if (!authValid || !diagnosisId) {
    return <p>Acceso denegado</p>;
  }

  if (!loadingDiagnosis && diagnosisError) {
    return <p>{diagnosisError}</p>;
  }

  const handleGuardar = () => {
    console.log('diagnosisId:', diagnosisId);
    console.log('informe:', informe);
  };

  return (
    <div>
      <div>{diagnosisId}</div>

      {loadingDiagnosis && <p>Cargando...</p>}

      {diagnosisData && (
        <div>
          <p><strong>Diagnóstico:</strong> {diagnosisData.diagnosis}</p>
          <p><strong>Material:</strong> {diagnosisData.material}</p>
          <p><strong>Profesional solicitante:</strong> {diagnosisData.profesionalSolicitante}</p>
          <p><strong>Biopsias previas:</strong> {diagnosisData.biopsasPrevias ? 'Sí' : 'No'}</p>
          <p><strong>Fecha:</strong> {new Date(diagnosisData.createdAt).toLocaleString()}</p>
        </div>
      )}

      <div>
        <label htmlFor="informe">Informe</label>
        <textarea
          id="informe"
          value={informe}
          onChange={(e) => setInforme(e.target.value)}
        />
      </div>

      <button onClick={handleGuardar}>Guardar Informe</button>
    </div>
  );
}
