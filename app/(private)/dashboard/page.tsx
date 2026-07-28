'use client';

import { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BiotechIcon from '@mui/icons-material/Biotech';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import ArticleIcon from '@mui/icons-material/Article';

interface Stats {
  patients: number;
  diagnoses: number;
  notas: number;
  informes: number;
}

interface StatCard {
  label: string;
  key: keyof Stats;
  icon: React.ReactNode;
  color: string;
}

const cards: StatCard[] = [
  { label: 'Pacientes', key: 'patients', icon: <PeopleAltIcon sx={{ fontSize: 40 }} />, color: '#1976d2' },
  { label: 'Diagnósticos', key: 'diagnoses', icon: <BiotechIcon sx={{ fontSize: 40 }} />, color: '#388e3c' },
  { label: 'Notas de técnico', key: 'notas', icon: <StickyNote2Icon sx={{ fontSize: 40 }} />, color: '#f57c00' },
  { label: 'Informes', key: 'informes', icon: <ArticleIcon sx={{ fontSize: 40 }} />, color: '#7b1fa2' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Resumen general del sistema.
        </Typography>

        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid key={card.key} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={2}
                sx={{
                  borderTop: `4px solid ${card.color}`,
                  height: '100%',
                }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 3 }}>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                  {loading ? (
                    <Skeleton variant="text" width={60} height={48} />
                  ) : (
                    <Typography variant="h3" fontWeight={700} lineHeight={1}>
                      {stats?.[card.key] ?? 0}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {card.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
