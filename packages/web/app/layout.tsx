import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ピロリ���菌除���菌タワーディフェンス',
  description: '���胃の中を���舞台にした教育系タワーディフェンスゲーム',
  manifest: '/manifest.json',
  themeColor: '#881337',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
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
    <html lang="ja">
      <body className="min-h-[100dvh] flex flex-col items-center justify-center">
        {children}
      </body>
    </html>
  );
}

// Client-only service worker registration
if (typeof window !== 'undefined') {
  // This code runs only on the client
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch((error) => {
        console.log('ServiceWorker registration failed: ', error);
      });
    });
  }
}
