import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SkillBridge | AI-Powered Skill Swapping',
  description: 'Connect with others to offer your skills and learn new ones.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-50 selection:bg-teal-500/30 selection:text-teal-200 font-sans">
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
            <div className="container mx-auto flex h-16 items-center px-4">
              <div className="flex gap-2 items-center font-bold text-xl tracking-tight text-white">
                <span className="text-teal-400">Skill</span>Bridge
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
