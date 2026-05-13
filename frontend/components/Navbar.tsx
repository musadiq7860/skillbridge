"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navLink = (href: string, label: string, Icon: React.ElementType) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-teal-500/10 text-teal-400"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-1 font-bold text-xl tracking-tight text-white">
          <span className="text-teal-400">Skill</span>Bridge
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              {navLink("/dashboard", "Dashboard", LayoutDashboard)}
              {navLink("/profile", "Profile", User)}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-teal-500 hover:bg-teal-600 text-slate-900 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-400 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {user ? (
            <>
              {navLink("/dashboard", "Dashboard", LayoutDashboard)}
              {navLink("/profile", "Profile", User)}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-teal-500 hover:bg-teal-600 text-slate-900 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
