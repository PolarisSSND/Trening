'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { UserRole } from '@/lib/types';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, isDemo, switchDemoRole } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('clen');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          router.push('/');
        }
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Prosím zadajte vaše celé meno');
          setLoading(false);
          return;
        }
        const res = await signup(email, password, fullName.trim(), role);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Nastala neočakávaná chyba');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoRole: UserRole) => {
    switchDemoRole(demoRole);
    router.push('/');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-6 animate-fade-in">
      <div className="w-full max-w-md space-y-5">
        {/* Logo a záhlavie */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-xl font-black mx-auto shadow-xl shadow-emerald-500/25">
            ŠT
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Športový Tím
          </h1>
          <p className="text-xs text-slate-400">
            Správa tréningov, dochádzka a komunikácia pre váš tím
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-800 mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prihlásenie
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nová registrácia
            </button>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Celé meno (iba registrácia) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Celé meno a priezvisko *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="napr. Peter Novák"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mailová adresa *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vas-email@klub.sk"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Heslo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Heslo *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Výber roly pri registrácii */}
            {mode === 'signup' && (
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tvoja rola v tíme:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('clen')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      role === 'clen'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500 ring-2 ring-sky-500/50'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Hráč / Športovec
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('trener')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      role === 'trener'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/50'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Tréner / Správca
                  </button>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.01]"
            >
              {loading ? (
                'Spracovávam...'
              ) : mode === 'login' ? (
                <>
                  Prihlásiť sa do tímu
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Zaregistrovať sa do tímu
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rýchly Demo Vstup */}
          <div className="mt-6 pt-5 border-t border-slate-700/80 text-center">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-2.5">
              alebo rýchle vyskúšanie bez hesla:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('trener')}
                className="py-2 px-2.5 bg-slate-900 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Vstup ako Tréner
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('clen')}
                className="py-2 px-2.5 bg-slate-900 hover:bg-slate-750 text-sky-400 hover:text-sky-300 border border-slate-700 hover:border-sky-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Vstup ako Hráč
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
