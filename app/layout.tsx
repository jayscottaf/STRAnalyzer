import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistrar } from './sw-register';

export const metadata: Metadata = {
  title: 'STR Deal Analyzer — Short-Term Rental Investment Analysis',
  description:
    'Professional investment analysis tool for short-term rental properties. Calculate cash-on-cash returns, cap rates, tax benefits, and get AI-powered deal verdicts.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'STR Analyzer',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f1117',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-bg-base text-text-foreground">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
