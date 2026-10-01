'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';

import DashboardIcon from '@mui/icons-material/Dashboard';
import BiotechIcon from '@mui/icons-material/Biotech';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonalInjuryIcon from '@mui/icons-material/PersonalInjury';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Diagnósticos', href: '/pacientes', icon: <BiotechIcon /> },
  { label: 'Nuevo Diagnóstico', href: '/pacientes/nuevo', icon: <AddCircleOutlineIcon /> },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { perfilId, userName, perfilTipo } = useAuth();

  const canCreateDiagnosis = perfilId === 1 || perfilId === 4;
  const perfilLabel =
    perfilTipo === 'administrativo'
      ? 'Administrativo'
      : perfilTipo === 'tecnico'
        ? 'Técnico'
        : perfilTipo === 'medico'
          ? 'Médico'
          : perfilTipo === 'superusuario'
            ? 'Superusuario'
            : perfilTipo || 'Perfil';

  const visibleNavItems = navItems.filter(
    (item) => item.href !== '/pacientes/nuevo' || canCreateDiagnosis,
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isCollapsed ? collapsedDrawerWidth : drawerWidth,
        flexShrink: 0,
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        '& .MuiDrawer-paper': {
          width: isCollapsed ? collapsedDrawerWidth : drawerWidth,
          boxSizing: 'border-box',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-end',
          px: 1,
          py: 0.5,
        }}
      >
        <IconButton onClick={toggleSidebar} size="small">
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <Box sx={{ overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List sx={{ px: 1 }}>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  minHeight: 48,
                  justifyContent: isCollapsed ? 'center' : 'initial',
                  px: 2.5,
                  borderRadius: 2,
                  mb: 0.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isCollapsed ? 'auto' : 3,
                    justifyContent: 'center',
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: isCollapsed ? 0 : 1,
                    display: isCollapsed ? 'none' : 'block',
                    transition: 'opacity 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
        <Divider sx={{ mx: isCollapsed ? 1 : 2 }} />
        <List sx={{ px: 1 }}>
          {perfilId === 4 && (() => {
            const isActive = pathname === '/usuarios';
            return (
              <ListItemButton
                component={Link}
                href="/usuarios"
                selected={isActive}
                sx={{
                  minHeight: 48,
                  justifyContent: isCollapsed ? 'center' : 'initial',
                  px: 2.5,
                  borderRadius: 2,
                  mb: 0.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isCollapsed ? 'auto' : 3,
                    justifyContent: 'center',
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  <ManageAccountsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Crear o editar usuario"
                  sx={{
                    opacity: isCollapsed ? 0 : 1,
                    display: isCollapsed ? 'none' : 'block',
                    transition: 'opacity 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                />
              </ListItemButton>
            );
          })()}
          {perfilId === 4 && (() => {
            const isActive = pathname === '/pacientes-admin';
            return (
              <ListItemButton
                component={Link}
                href="/pacientes-admin"
                selected={isActive}
                sx={{
                  minHeight: 48,
                  justifyContent: isCollapsed ? 'center' : 'initial',
                  px: 2.5,
                  borderRadius: 2,
                  mb: 0.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isCollapsed ? 'auto' : 3,
                    justifyContent: 'center',
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  <PersonalInjuryIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Crear o editar paciente"
                  sx={{
                    opacity: isCollapsed ? 0 : 1,
                    display: isCollapsed ? 'none' : 'block',
                    transition: 'opacity 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                />
              </ListItemButton>
            );
          })()}
          {(() => {
            const isActive = pathname === '/perfil';
            return (
              <>
                <ListItemButton
                  component={Link}
                  href="/perfil"
                  selected={isActive}
                  sx={{
                    minHeight: 48,
                    justifyContent: isCollapsed ? 'center' : 'initial',
                    px: 2.5,
                    borderRadius: 2,
                    mb: 0.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isCollapsed ? 'auto' : 3,
                      justifyContent: 'center',
                      color: isActive ? 'primary.main' : 'inherit',
                    }}
                  >
                    <AccountCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Mi Cuenta"
                    sx={{
                      opacity: isCollapsed ? 0 : 1,
                      display: isCollapsed ? 'none' : 'block',
                      transition: 'opacity 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  />
                </ListItemButton>
                {!isCollapsed && (
                  <Box
                    sx={{
                      px: 2.5,
                      pb: 1.5,
                      pt: 0.5,
                      ml: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 2,
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {userName?.charAt(0)?.toUpperCase() || 'U'}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {userName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            lineHeight: 1.2,
                            textTransform: 'capitalize',
                          }}
                        >
                          {perfilLabel}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </>
            );
          })()}
        </List>
      </Box>
    </Drawer>
  );
}
