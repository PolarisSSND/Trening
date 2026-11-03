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

  // Výpočet dochádzky člena
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
  const members = filteredProfiles.filter((p) => p.role === 'clen');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-md">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-xl">
              Súpiska Klubu
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              Tím & Štatistiky
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Prehľad registrovaných členov tímu, ich tréningovej dochádzky a klubových rolí.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Celkom členov</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">{profiles.length}</span>
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
            placeholder="Hľadať člena podľa mena alebo emailu..."
            className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Načítavam súpisku tímu...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tréneri */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3 px-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Tréneri a vedenie tímu ({coaches.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold text-sm flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
                      {coach.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{coach.full_name}</span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">
                          Tréner
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">{coach.email}</span>
                    </div>
                  </div>

                  {isTrener && coach.id !== user?.id && (
                    <button
                      onClick={() => handleChangeRole(coach.id, 'clen')}
                      className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors shrink-0"
                      title="Zmeniť rolu na bežného člena"
                    >
                      Zmeniť na člena
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Členovia tímu */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3 px-1">
              <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Členovia tímu ({members.length})
            </h2>

            {members.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                Žiadni členovia nezodpovedajú vyhľadávaniu.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {members.map((member) => {
                  const stats = calculateStats(member.id);
                  return (
                    <div
                      key={member.id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 font-bold text-sm flex items-center justify-center border border-sky-200 dark:border-sky-500/30 shrink-0">
                          {member.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                            {member.full_name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                            {member.email}
                          </span>

                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              {stats.percentage}% účasť ({stats.count} trén.)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Coach Action: Promote to coach */}
                      {isTrener && (
                        <button
                          onClick={() => handleChangeRole(member.id, 'trener')}
                          className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-700/80 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors shrink-0 flex items-center gap-1"
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
