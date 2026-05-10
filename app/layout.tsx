import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NexusFlow AI | Smart Traffic Junction Optimization',
  description: 'AI-powered traffic junction optimization system for smart cities. Real-time analysis, dynamic signal control, and congestion prediction.',
  keywords: 'AI traffic management, smart city, junction optimization, traffic signals, congestion control',
  openGraph: {
    title: 'NexusFlow AI | Smart Traffic Junction Optimization',
    description: 'AI-powered real-time traffic optimization for smart cities',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased bg-dark-950 text-white`}>
        {children}
      </body>
    </html>
  );
}
