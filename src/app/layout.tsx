import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Gantt Studio',
  description:
    'Plan projects as a Gantt chart in the browser: drag tasks, link dependencies, see the critical path, and edit the same plan as Mermaid text. Nothing leaves your browser.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-(family-name:--font-inter)">
        {children}
      </body>
    </html>
  );
}
