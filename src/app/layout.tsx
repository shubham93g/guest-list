import type { Metadata, Viewport } from 'next';
import { brideCoupleName } from '@/config/wedding';
import './globals.css';

export const metadata: Metadata = {
  title: `Wedding of ${brideCoupleName}`,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black">
      <head>
        <link rel="preload" as="image" href="/hero.jpg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
