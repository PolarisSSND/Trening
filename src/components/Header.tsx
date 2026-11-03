'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import ThemeToggle from './ThemeToggle';
import { ShieldCheck, User, Sparkles } from 'lucide-react';

export default function Header() {
  const { user, isTrener, isDemo, switchDemoRole } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-900/90 dark:bg-slate-900/90 border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <span className="font-black text-lg tracking-wider">ŠT</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-base leading-tight tracking-tight">Športový Tím</span>
            </div>
            <p className="text-xs text-slate-400">Tréningy & Dochádzka</p>
          </div>
        </Link>

        {/* Right side tools */}
        <div className="flex items-center gap-2">
          {/* Quick Demo Switcher if in Demo mode */}
          {isDemo && (
            <div className="hidden sm:flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => switchDemoRole('trener')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  isTrener
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Prepnúť pohľad na trénera"
              >
                Tréner
              </button>
              <button
                onClick={() => switchDemoRole('clen')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  !isTrener
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Prepnúť pohľad na hráča"
              >
                Hráč
              </button>
            </div>
          )}

          {/* User role pill */}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            {isTrener ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Tréner</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sky-400">
                <User className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Hráč</span>
              </span>
            )}
            <span className="max-w-[90px] truncate text-slate-300">
              {user ? user.full_name.split(' ')[0] : 'Profil'}
            </span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>

      {/* Demo Banner Notification */}
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border-b border-amber-500/20 px-3 py-1 text-center">
          <p className="text-[11px] text-amber-300 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>
              <strong>Demo režim aktívny:</strong> Testujete ako{' '}
              <strong className="underline">{isTrener ? 'Tréner (Admin)' : 'Hráč (Člen)'}</strong>.{' '}
              <span className="hidden sm:inline">Pre plnú databázu nastavte kľúče v Supabase.</span>
            </span>
          </p>
        </div>
      )}
    </header>
  );
}
