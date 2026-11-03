'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  User,
  ShieldCheck,
  Mail,
  Download,
  Database,
  LogOut,
  CheckCircle2,
  Share,
  PlusSquare,
  Smartphone,
  Save,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isTrener, isDemo, switchDemoRole, updateProfileName, logout } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
    }
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, [user]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSaving(true);
    const { error } = await updateProfileName(fullName.trim());
    setIsSaving(false);

    if (error) {
      alert(error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-500/30">
            {user ? user.full_name.charAt(0) : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {user?.full_name || 'Používateľský profil'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {user?.email || 'demo@sportklub.sk'}
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                  isTrener
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                }`}
              >
                {isTrener ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Tréner (Správca klubu)
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5" />
                    Člen (Hráč)
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-3">Upraviť osobné údaje</h3>
        <form onSubmit={handleSaveName} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Celé meno a priezvisko
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Meno bolo úspešne uložené!
              </span>
            ) : <div />}

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Ukladám...' : 'Uložiť zmenu'}
            </button>
          </div>
        </form>
      </div>

      {/* Demo Switcher Box (iba v demo režime) */}
      {isDemo && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400 font-bold text-sm">🧪 Demo režim - Testovanie rolí</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Aplikácia beží v predvádzacom režime. Môžete okamžite prepínať medzi pohľadom Trénera (plné práva správy tréningov) a Hráča (evidencia dochádzky).
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => switchDemoRole('trener')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                isTrener
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              Prepnúť na Trénera
            </button>

            <button
              onClick={() => switchDemoRole('clen')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                !isTrener
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <User className="w-5 h-5" />
              Prepnúť na Hráča
            </button>
          </div>
        </div>
      )}

      {/* PWA Inštalácia návod */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Inštalácia do mobilu (PWA)</h3>
        </div>

        {isStandalone ? (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Aplikácia je úspešne spustená z plochy vášho zariadenia ako PWA!</span>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-300">
            <p>
              Túto aplikáciu si môžete nainštalovať priamo na plochu mobilu ako natívnu aplikáciu bez sťahovania z App Store / Google Play:
            </p>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <strong className="text-white block">🍎 Návod pre Apple iPhone (iOS Safari):</strong>
              <p>
                1. Otvorte túto stránku v prehliadači Safari.<br />
                2. Klepnite na ikonu <strong>Zdieľať</strong> <Share className="inline w-3.5 h-3.5 text-sky-400" /> dole v strede.<br />
                3. Zvoľte možnosť <strong>„Pridať na plochu“</strong> <PlusSquare className="inline w-3.5 h-3.5 text-emerald-400" />.
              </p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <strong className="text-white block">🤖 Návod pre Android (Google Chrome):</strong>
              <p>
                1. Otvorte v Chrome menu (3 bodky vpravo hore).<br />
                2. Klepnite na <strong>„Inštalovať aplikáciu“</strong> alebo <strong>„Pridať na plochu“</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stav Supabase databázy */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold text-white">Stav Supabase Databázy</h3>
        </div>

        {isSupabaseConfigured ? (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Supabase je úspešne pripojené cez environmentálne premenné.</span>
          </div>
        ) : (
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1.5">
            <span className="font-semibold text-amber-300 block">
              Aktuálne beží v Demo režime (bez live DB)
            </span>
            <p>
              Pre pripojenie naživo vložte kľúče z vášho Supabase projektu do súboru{' '}
              <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">.env.local</code>{' '}
              alebo do Vercel Environment Variables:
            </p>
            <div className="font-mono text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
              NEXT_PUBLIC_SUPABASE_URL=...<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=...
            </div>
          </div>
        )}
      </div>

      {/* Odhlásenie */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Odhlásiť sa
        </button>
      </div>
    </div>
  );
}
