import Box from '@mui/material/Box';
import AppTopBar from '../../components/layout/AppTopBar';
import AppSidebar from '../../components/layout/AppSidebar';
import PrivateLayoutContent from '../../components/layout/PrivateLayoutContent';
import PrivateRouteGuard from '../../components/auth/PrivateRouteGuard';

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivateRouteGuard>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <AppTopBar />
        <AppSidebar />
        <PrivateLayoutContent>{children}</PrivateLayoutContent>
      </Box>
    </PrivateRouteGuard>
  );
}
