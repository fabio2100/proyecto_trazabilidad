'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface DiagnosisData {
  id: string;
  patientId: string;
  diagnosis: string;
  material: string;
  profesionalSolicitante: string;
  biopsasPrevias: boolean;
  createdAt: string;
}

export default function InformesContent() {
  const searchParams = useSearchParams();
  const diagnosisId = useParams<{diagnosisId: string}>().diagnosisId || searchParams.get('diagnosisId') || '';
  const { isAuthenticated, isAuthLoading } = useAuth();

  const [informe, setInforme] = useState('');
  const [savingInforme, setSavingInforme] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !diagnosisId) return;

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
  }, [isAuthenticated, diagnosisId]);

  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated || !diagnosisId) {
    return <p>Acceso denegado</p>;
  }

  if (!loadingDiagnosis && diagnosisError) {
    return <p>{diagnosisError}</p>;
  }

  const handleGuardar = async () => {
    const informeValue = informe.trim();

    if (!informeValue) {
      window.alert('Debe ingresar un informe antes de guardar.');
      return;
    }

    try {
      setSavingInforme(true);
      const response = await fetch('/api/guardarInforme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosisId,
          informe: informeValue,
        }),
      });

      const data = await response.json();
      window.alert(data.message ?? (data.ok ? 'Informe guardado correctamente.' : 'No se pudo guardar el informe.'));
    } catch {
      window.alert('Error de red al guardar el informe.');
    } finally {
      setSavingInforme(false);
    }
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

      <button onClick={handleGuardar} disabled={savingInforme}>
        {savingInforme ? 'Guardando...' : 'Guardar Informe'}
      </button>
    </div>
  );
}
