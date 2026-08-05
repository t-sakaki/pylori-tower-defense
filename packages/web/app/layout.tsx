import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ピロリ菌除菌タワーディフェンス',
  description: '胃の中を舞台にした教育系タワーディフェンスゲーム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col items-center justify-center">
        {children}
      </body>
    </html>
  );
}
