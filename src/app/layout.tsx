import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/authContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PwaRegister from '@/components/PwaRegister';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

export const metadata: Metadata = {
  title: 'Športový Tím - Dochádzka & Tréningy',
  description: 'Progresívna webová aplikácia (PWA) pre športové tímy a kluby na správu tréningov a evidenciu dochádzky hráčov.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TímDochádzka',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TímDochádzka" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="bg-slate-900 text-slate-100 flex flex-col min-h-screen selection:bg-emerald-500 selection:text-white">
        <AuthProvider>
          <PwaRegister />
          <Header />
          <main className="flex-1 pb-24 sm:pb-20 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6">
            {children}
          </main>
          <PwaInstallPrompt />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
