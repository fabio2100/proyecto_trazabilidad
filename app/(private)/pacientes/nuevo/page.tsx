import { Container, Box } from '@mui/material';
import PatientForm from '@/components/forms/PatientForm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import { getPool } from '@/lib/db';

export default async function NuevoPaciente() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    redirect('/login');
  }

  const { userId } = await verifyToken(token);
  const pool = getPool();
  const result = await pool.query<{ perfilId: number }>(
    'SELECT "perfilId" FROM "Users" WHERE id = $1',
    [userId],
  );

  const perfilId = result.rows[0]?.perfilId;

  if (perfilId !== 2 && perfilId !== 4) {
    redirect('/pacientes');
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <PatientForm />
      </Box>
    </Container>
  );
}