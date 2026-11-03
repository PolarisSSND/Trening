'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { Profile, Training, Attendance, UserRole } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_PROFILES, MOCK_TRAININGS, MOCK_ATTENDANCES } from '@/lib/mockData';
import {
  Users,
  ShieldCheck,
  User,
  Search,
  Award,
  CalendarCheck,
  TrendingUp,
  UserCog,
} from 'lucide-react';

export default function TeamPage() {
  const { user, isTrener, isDemo } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      setLoading(true);
      if (!isSupabaseConfigured || isDemo) {
        setProfiles(MOCK_PROFILES);
        setTrainings(MOCK_TRAININGS);
        setAttendances(MOCK_ATTENDANCES);
        setLoading(false);
        return;
      }

      try {
        const [profRes, trRes, attRes] = await Promise.all([
          supabase.from('profiles').select('*').order('role', { ascending: false }),
          supabase.from('trainings').select('*'),
          supabase.from('attendance').select('*'),
        ]);

        if (profRes.data) setProfiles(profRes.data);
        if (trRes.data) setTrainings(trRes.data);
        if (attRes.data) setAttendances(attRes.data);
      } catch (err) {
        console.error(err);
        setProfiles(MOCK_PROFILES);
        setTrainings(MOCK_TRAININGS);
        setAttendances(MOCK_ATTENDANCES);
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [isDemo]);

  // Zmena roly používateľa (pre trénera)
  const handleChangeRole = async (targetId: string, newRole: UserRole) => {
    if (!isTrener) return;

    if (!isSupabaseConfigured || isDemo) {
      const updated = profiles.map((p) =>
        p.id === targetId ? { ...p, role: newRole } : p
      );
      setProfiles(updated);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetId);

      if (error) throw error;
      setProfiles((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, role: newRole } : p))
      );
    } catch (err: any) {
      alert('Chyba pri zmene roly: ' + err.message);
    }
  };

  // Výpočet dochádzky hráča
  const calculateStats = (userId: string) => {
    const totalTrainings = trainings.length;
    if (totalTrainings === 0) return { count: 0, percentage: 0 };

    const userYesCount = attendances.filter(
      (a) => a.user_id === userId && a.status === 'yes'
    ).length;

    const percentage = Math.round((userYesCount / totalTrainings) * 100);
    return { count: userYesCount, percentage };
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const coaches = filteredProfiles.filter((p) => p.role === 'trener');
  const players = filteredProfiles.filter((p) => p.role === 'clen');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
              Súpiska Klubu
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
              Tím & Štatistiky
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Prehľad registrovaných členov tímu, ich tréningovej dochádzky a klubových rolí.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-slate-400 block font-medium">Celkom členov</span>
              <span className="text-base font-bold text-white">{profiles.length}</span>
            </div>
          </div>
        </div>

        {/* Vyhľadávanie */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Hľadať hráča podľa mena alebo emailu..."
            className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Načítavam súpisku tímu...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tréneri */}
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3 px-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tréneri a vedenie tímu ({coaches.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coaches.map((coach) => {
                const stats = calculateStats(coach.id);
                return (
                  <div
                    key={coach.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center border border-emerald-500/30">
                        {coach.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white">{coach.full_name}</span>
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Tréner
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 block">{coach.email}</span>
                      </div>
                    </div>

                    {isTrener && coach.id !== user?.id && (
                      <button
                        onClick={() => handleChangeRole(coach.id, 'clen')}
                        className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors shrink-0"
                        title="Zmeniť rolu na bežného člena"
                      >
                        Zmeniť na hráča
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hráči / Členovia */}
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3 px-1">
              <User className="w-4 h-4 text-sky-400" />
              Hráči a športovci ({players.length})
            </h2>

            {players.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
                Žiadni hráči nezodpovedajú vyhľadávaniu.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((player) => {
                  const stats = calculateStats(player.id);
                  return (
                    <div
                      key={player.id}
                      className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 font-bold text-sm flex items-center justify-center border border-sky-500/30 shrink-0">
                          {player.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-white block truncate">
                            {player.full_name}
                          </span>
                          <span className="text-xs text-slate-400 block truncate">
                            {player.email}
                          </span>

                          {/* Dochádzka progress pill */}
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-400">
                              {stats.percentage}% účasť ({stats.count} trén.)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Coach Action: Promote to coach */}
                      {isTrener && (
                        <button
                          onClick={() => handleChangeRole(player.id, 'trener')}
                          className="text-xs px-2.5 py-1 bg-slate-700/80 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg transition-colors shrink-0 flex items-center gap-1"
                          title="Povýšiť na trénera"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Povýšiť</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
