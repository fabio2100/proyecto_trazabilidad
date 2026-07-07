import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import ThemeRegistry from './theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import "./globals.css";

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "Aplicación de Trazabilidad de Muestras Patológicas",
  description: "Sistema de trazabilidad para muestras patológicas",
  icons: [
    { url: '/logo.svg', type: 'image/svg+xml' },
    { url: '/logo.png', type: 'image/png' },
    { url: '/logo.jpeg', type: 'image/jpeg' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={roboto.variable}>
      <body>
        <AppRouterCacheProvider>
          <ThemeRegistry>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
