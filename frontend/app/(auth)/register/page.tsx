"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // In a real app we might also insert into profiles manually if triggers aren't set
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, name });
      
      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl glass">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join <span className="text-brand">SkillBridge</span></h1>
          <p className="text-slate-400">Start swapping skills with AI-matched peers.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="name">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
                placeholder="Ada Lovelace"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
                placeholder="ada@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-slate-900 bg-brand hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand hover:text-brand-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
