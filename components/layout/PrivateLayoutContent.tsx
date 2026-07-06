'use client';

import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { useSidebar } from '@/hooks/useSidebar';

export default function PrivateLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const drawerWidth = 240;
  const collapsedDrawerWidth = 64;

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        width: {
          sm: `calc(100% - ${isCollapsed ? collapsedDrawerWidth : drawerWidth}px)`,
        },
        transition: (theme) =>
          theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      <Toolbar />
      {children}
    </Box>
  );
}
