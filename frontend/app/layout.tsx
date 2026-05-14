import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SkillBridge | AI-Powered Skill Swapping',
  description:
    'Connect with others to offer your skills and learn new ones through AI-powered matching.',
};

import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${inter.variable} antialiased dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-50 selection:bg-teal-500/30 selection:text-teal-200 font-sans">
        <div className="relative flex min-h-screen flex-col">
          <Navbar initialUser={user} />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
