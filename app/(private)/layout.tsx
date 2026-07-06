import Box from '@mui/material/Box';
import AppTopBar from '../../components/layout/AppTopBar';
import AppSidebar from '../../components/layout/AppSidebar';
import PrivateLayoutContent from '../../components/layout/PrivateLayoutContent';
import PrivateRouteGuard from '../../components/auth/PrivateRouteGuard';
import { SidebarProvider } from '@/context/SidebarContext';

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivateRouteGuard>
      <SidebarProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <AppTopBar />
          <AppSidebar />
          <PrivateLayoutContent>{children}</PrivateLayoutContent>
        </Box>
      </SidebarProvider>
    </PrivateRouteGuard>
  );
}
