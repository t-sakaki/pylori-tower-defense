import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ピロリ菌除菌タワーディフェンス',
  description: '胃の中を舞台にした教育系タワーディフェンスゲーム',
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
