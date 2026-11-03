'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import {
  Training,
  Attendance,
  Profile,
  TrainingWithAttendance,
  AttendanceStatus,
  TrainingStatus,
} from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  MOCK_TRAININGS,
  MOCK_ATTENDANCES,
  MOCK_PROFILES,
} from '@/lib/mockData';
import TrainingCard from '@/components/TrainingCard';
import TrainingModal from '@/components/TrainingModal';
import ShareTrainingModal from '@/components/ShareTrainingModal';
import {
  Plus,
  Calendar,
  History,
  Filter,
  Sparkles,
} from 'lucide-react';

export default function Dashboard() {
  const { user, isTrener, isDemo } = useAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtre
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'cancelled'>('all');

  // Modaly
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [trainingToShare, setTrainingToShare] = useState<TrainingWithAttendance | null>(null);

  // Načítanie dát
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);

      if (!isSupabaseConfigured || isDemo) {
        const savedTr = localStorage.getItem('demo_trainings');
        const savedAtt = localStorage.getItem('demo_attendances');

        if (isMounted) {
          setTrainings(savedTr ? JSON.parse(savedTr) : MOCK_TRAININGS);
          setAttendances(savedAtt ? JSON.parse(savedAtt) : MOCK_ATTENDANCES);
          setProfiles(MOCK_PROFILES);
          setLoading(false);
        }
        return;
      }

      try {
        const [trRes, attRes, profRes] = await Promise.all([
          supabase.from('trainings').select('*').order('date_time', { ascending: true }),
          supabase.from('attendance').select('*, profile:profiles(*)'),
          supabase.from('profiles').select('*'),
        ]);

        if (isMounted) {
          if (trRes.data) setTrainings(trRes.data);
          if (attRes.data) setAttendances(attRes.data);
          if (profRes.data) setProfiles(profRes.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Chyba pri načítaní dát:', err);
        if (isMounted) {
          setTrainings(MOCK_TRAININGS);
          setAttendances(MOCK_ATTENDANCES);
          setProfiles(MOCK_PROFILES);
          setLoading(false);
        }
      }
    }

    loadData();

    // Realtime odber pre zmeny v Supabase
    if (isSupabaseConfigured && !isDemo) {
      const channel = supabase
        .channel('dashboard-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trainings' },
          () => {
            loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'attendance' },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isDemo]);

  // Pomocné uloženie pre demo režim
  const saveDemoState = (newTrainings: Training[], newAttendances: Attendance[]) => {
    setTrainings(newTrainings);
    setAttendances(newAttendances);
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_trainings', JSON.stringify(newTrainings));
      localStorage.setItem('demo_attendances', JSON.stringify(newAttendances));
    }
  };

  // Zjednodušené prihlásenie / odhlásenie jedným klikom
  const handleToggleAttendance = async (trainingId: string, shouldSignUp: boolean) => {
    if (!user) return;
    const newStatus: AttendanceStatus = shouldSignUp ? 'yes' : 'no';

    if (!isSupabaseConfigured || isDemo) {
      const existingIdx = attendances.findIndex(
        (a) => a.training_id === trainingId && a.user_id === user.id
      );

      let updatedList = [...attendances];
      if (existingIdx >= 0) {
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
      } else {
        const newAtt: Attendance = {
          id: `att-${Date.now()}`,
          training_id: trainingId,
          user_id: user.id,
          status: newStatus,
          reason: null,
          updated_at: new Date().toISOString(),
          profile: user,
        };
        updatedList.push(newAtt);
      }

      saveDemoState(trainings, updatedList);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(
          {
            training_id: trainingId,
            user_id: user.id,
            status: newStatus,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'training_id,user_id' }
        )
        .select('*, profile:profiles(*)');

      if (error) {
        console.error('Chyba pri ukladaní dochádzky:', error);
        alert('Nepodarilo sa aktualizovať dochádzku: ' + error.message);
        return;
      }

      if (data && data[0]) {
        setAttendances((prev) => {
          const filtered = prev.filter(
            (a) => !(a.training_id === trainingId && a.user_id === user.id)
          );
          return [...filtered, data[0]];
        });
      }
    } catch (err: any) {
      console.error(err);
      alert('Chyba: ' + err.message);
    }
  };

  // Vytvorenie alebo úprava tréningu
  const handleSaveTraining = async (data: {
    id?: string;
    title: string;
    date_time: string;
    location: string;
    notes: string;
    status: TrainingStatus;
  }) => {
    if (!isSupabaseConfigured || isDemo) {
      if (data.id) {
        const updated = trainings.map((t) =>
          t.id === data.id
            ? {
                ...t,
                title: data.title,
                date_time: data.date_time,
                location: data.location,
                notes: data.notes || null,
                status: data.status,
              }
            : t
        );
        saveDemoState(updated, attendances);
      } else {
        const newTr: Training = {
          id: `tr-${Date.now()}`,
          title: data.title,
          date_time: data.date_time,
          location: data.location,
          notes: data.notes || null,
          status: data.status,
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
        };
        saveDemoState([newTr, ...trainings], attendances);
      }
      return;
    }

    try {
      if (data.id) {
        const { error } = await supabase
          .from('trainings')
          .update({
            title: data.title,
            date_time: data.date_time,
            location: data.location,
            notes: data.notes || null,
            status: data.status,
          })
          .eq('id', data.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('trainings').insert({
          title: data.title,
          date_time: data.date_time,
          location: data.location,
          notes: data.notes || null,
          status: data.status,
          created_by: user?.id,
        });

        if (error) throw error;
      }

      const { data: refreshed } = await supabase
        .from('trainings')
        .select('*')
        .order('date_time', { ascending: true });
      if (refreshed) setTrainings(refreshed);
    } catch (err: any) {
      console.error('Chyba pri ukladaní tréningu:', err);
      alert('Nepodarilo sa uložiť tréning: ' + err.message);
    }
  };

  // Zmazanie tréningu
  const handleDeleteTraining = async (id: string) => {
    if (!isSupabaseConfigured || isDemo) {
      const remainingTr = trainings.filter((t) => t.id !== id);
      const remainingAtt = attendances.filter((a) => a.training_id !== id);
      saveDemoState(remainingTr, remainingAtt);
      return;
    }

    try {
      const { error } = await supabase.from('trainings').delete().eq('id', id);
      if (error) throw error;
      setTrainings((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert('Chyba pri mazaní: ' + err.message);
    }
  };

  // Prepojenie tréningov s dochádzkou
  const trainingsWithAttendance: TrainingWithAttendance[] = trainings.map((training) => {
    const trainingAtt = attendances
      .filter((a) => a.training_id === training.id)
      .map((a) => {
        const prof = a.profile || profiles.find((p) => p.id === a.user_id);
        return { ...a, profile: prof };
      });

    const myAtt = user
      ? trainingAtt.find((a) => a.user_id === user.id)
      : undefined;

    const yesCount = trainingAtt.filter((a) => a.status === 'yes').length;
    const noCount = trainingAtt.filter((a) => a.status === 'no').length;
    const maybeCount = trainingAtt.filter((a) => a.status === 'maybe').length;
    const totalMembers = profiles.length > 0 ? profiles.length : 12;
    const unresponded = Math.max(0, totalMembers - (yesCount + noCount + maybeCount));

    return {
      ...training,
      attendances: trainingAtt,
      myAttendance: myAtt,
      counts: {
        yes: yesCount,
        no: noCount,
        maybe: maybeCount,
        unresponded,
        totalMembers,
      },
    };
  });

  const now = Date.now();
  const filteredTrainings = trainingsWithAttendance
    .filter((t) => {
      const time = new Date(t.date_time).getTime();
      if (activeTab === 'upcoming') {
        return time >= now - 6 * 3600 * 1000;
      } else {
        return time < now - 6 * 3600 * 1000;
      }
    })
    .filter((t) => {
      if (statusFilter === 'all') return true;
      return t.status === statusFilter;
    })
    .sort((a, b) => {
      const timeA = new Date(a.date_time).getTime();
      const timeB = new Date(b.date_time).getTime();
      return activeTab === 'upcoming' ? timeA - timeB : timeB - timeA;
    });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner / Hero pre tím */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Prehľad dochádzky tímu
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Plán Tréningov
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-md">
              Zaznamenaj svoju účasť vopred jedným klikom, aby tréner poznal počet prihlásených členov.
            </p>
          </div>

          {/* Vytvoriť tréning tlačidlo (pre trénera) */}
          {isTrener && (
            <button
              onClick={() => {
                setEditingTraining(null);
                setIsTrainingModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm px-4 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              Nový tréning
            </button>
          )}
        </div>

        {/* Quick Mini Stats */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="bg-white/80 dark:bg-slate-800/40 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Nadchádzajúce</span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {trainingsWithAttendance.filter((t) => new Date(t.date_time).getTime() >= now).length}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/40 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Aktívni členovia</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {profiles.length || 8}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/40 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Tvoje prihlásenia</span>
            <span className="text-lg sm:text-xl font-bold text-sky-600 dark:text-sky-400">
              {user
                ? attendances.filter((a) => a.user_id === user.id && a.status === 'yes').length
                : 0}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">trén.</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Nadchádzajúce vs Minulé */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'upcoming'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Nadchádzajúce
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'past'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Minulé tréningy
          </button>
        </div>

        {/* Filter podľa stavu (Koná sa vs Zrušený) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Všetky
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              statusFilter === 'scheduled'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Koná sa
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              statusFilter === 'cancelled'
                ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Zrušené
          </button>
        </div>
      </div>

      {/* Zoznam tréningov */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Načítavam plán tréningov...</p>
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Žiadne tréningy v tejto kategórii</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === 'upcoming'
              ? 'Momentálne nie sú naplánované žiadne nadchádzajúce tréningy.'
              : 'V histórii nie sú evidované žiadne staršie tréningy.'}
          </p>
          {isTrener && activeTab === 'upcoming' && (
            <button
              onClick={() => {
                setEditingTraining(null);
                setIsTrainingModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              Naplánovať prvý tréning
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrainings.map((training) => (
            <TrainingCard
              key={training.id}
              training={training}
              onToggleAttendance={handleToggleAttendance}
              onShare={(tr) => {
                setTrainingToShare(tr);
                setIsShareModalOpen(true);
              }}
              onEdit={(tr) => {
                setEditingTraining(tr);
                setIsTrainingModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modaly */}
      <TrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        onSave={handleSaveTraining}
        onDelete={handleDeleteTraining}
        trainingToEdit={editingTraining}
      />

      <ShareTrainingModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        training={trainingToShare}
      />
    </div>
  );
}
