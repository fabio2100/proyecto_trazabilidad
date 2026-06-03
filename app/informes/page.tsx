'use client';

import { Suspense } from 'react';
import InformesContent from './InformesContent';

export default function InformesPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <InformesContent />
    </Suspense>
  );
}
