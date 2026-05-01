import type { Metadata, Viewport } from 'next';
import { wedding } from '@/config/wedding';
import './globals.css';

export const metadata: Metadata = {
  title: `Wedding of ${wedding.coupleNames}`,
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
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/hero_2.jpg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
