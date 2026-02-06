import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Subscription Scanner - Find Hidden Subscriptions',
  description: 'Scan your Gmail to find forgotten subscriptions and save money. Read-only access, we never store your emails.',
  keywords: ['subscription', 'scanner', 'gmail', 'save money', 'recurring charges'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
