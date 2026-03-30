'use client';

import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

export default function PrivateLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
      <Toolbar />
      {children}
    </Box>
  );
}
