import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/authContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PwaRegister from '@/components/PwaRegister';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

export const metadata: Metadata = {
  title: 'Aforce - Dochádzka & Tréningy',
  description: 'Progresívna webová aplikácia (PWA) pre športové tímy a kluby na správu tréningov a evidenciu dochádzky členov.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aforce',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
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
    <html lang="sk" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TímDochádzka" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        {/* Okamžité nastavenie Dark/Light režimu pred vykreslením stránky */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex flex-col min-h-screen selection:bg-emerald-500 selection:text-white transition-colors duration-150">
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
