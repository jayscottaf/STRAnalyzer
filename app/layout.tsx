import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'STR Deal Analyzer — Short-Term Rental Investment Analysis',
  description:
    'Professional investment analysis tool for short-term rental properties. Calculate cash-on-cash returns, cap rates, tax benefits, and get AI-powered deal verdicts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-base text-text-foreground">
        {children}
      </body>
    </html>
  );
}
