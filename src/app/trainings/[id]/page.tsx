'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import {
  Training,
  Attendance,
  Profile,
  AttendanceStatus,
  TrainingStatus,
  TrainingWithAttendance,
} from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  MOCK_TRAININGS,
  MOCK_ATTENDANCES,
  MOCK_PROFILES,
} from '@/lib/mockData';
import TrainingModal from '@/components/TrainingModal';
import ShareTrainingModal from '@/components/ShareTrainingModal';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Edit,
  UserCheck,
  LogOut,
  Users,
  MessageCircle,
} from 'lucide-react';

export default function TrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trainingId = params?.id as string;
  const { user, isTrener, isDemo } = useAuth();

  const [training, setTraining] = useState<Training | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modaly
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Načítanie dát
  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      setLoading(true);

      if (!isSupabaseConfigured || isDemo) {
        const savedTr = localStorage.getItem('demo_trainings');
        const savedAtt = localStorage.getItem('demo_attendances');

        const allTr: Training[] = savedTr ? JSON.parse(savedTr) : MOCK_TRAININGS;
        const allAtt: Attendance[] = savedAtt ? JSON.parse(savedAtt) : MOCK_ATTENDANCES;

        const currentTr = allTr.find((t) => t.id === trainingId) || null;
        const currentAtt = allAtt.filter((a) => a.training_id === trainingId);

        if (isMounted) {
          setTraining(currentTr);
          setAttendances(currentAtt);
          setProfiles(MOCK_PROFILES);
          setLoading(false);
        }
        return;
      }

      try {
        const [trRes, attRes, profRes] = await Promise.all([
          supabase.from('trainings').select('*').eq('id', trainingId).single(),
          supabase.from('attendance').select('*, profile:profiles(*)').eq('training_id', trainingId),
          supabase.from('profiles').select('*'),
        ]);

        if (isMounted) {
          if (trRes.data) setTraining(trRes.data);
          if (attRes.data) setAttendances(attRes.data);
          if (profRes.data) setProfiles(profRes.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Chyba pri načítaní detailu tréningu:', err);
        const currentTr = MOCK_TRAININGS.find((t) => t.id === trainingId) || null;
        if (isMounted) {
          setTraining(currentTr);
          setAttendances(MOCK_ATTENDANCES.filter((a) => a.training_id === trainingId));
          setProfiles(MOCK_PROFILES);
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [trainingId, isDemo]);

  // Pomocná funkcia na uloženie v demo režime
  const saveDemoState = (updatedTraining: Training | null, updatedAttendances: Attendance[]) => {
    if (updatedTraining) {
      setTraining(updatedTraining);
      const savedTr = localStorage.getItem('demo_trainings');
      const allTr: Training[] = savedTr ? JSON.parse(savedTr) : MOCK_TRAININGS;
      const newAllTr = allTr.map((t) => (t.id === updatedTraining.id ? updatedTraining : t));
      localStorage.setItem('demo_trainings', JSON.stringify(newAllTr));
    }
    setAttendances(updatedAttendances);
    const savedAtt = localStorage.getItem('demo_attendances');
    const allAtt: Attendance[] = savedAtt ? JSON.parse(savedAtt) : MOCK_ATTENDANCES;
    const filteredOther = allAtt.filter((a) => a.training_id !== trainingId);
    localStorage.setItem('demo_attendances', JSON.stringify([...filteredOther, ...updatedAttendances]));
  };

  // Zmena dochádzky pre prihláseného používateľa alebo trénerom pre iného
  const handleToggleAttendance = async (targetUserId: string, shouldSignUp: boolean) => {
    if (!training) return;
    const newStatus: AttendanceStatus = shouldSignUp ? 'yes' : 'no';

    if (!isSupabaseConfigured || isDemo) {
      const existingIdx = attendances.findIndex((a) => a.user_id === targetUserId);
      let updatedList = [...attendances];
      const targetProf = profiles.find((p) => p.id === targetUserId);

      if (existingIdx >= 0) {
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          status: newStatus,
          updated_at: new Date().toISOString(),
          profile: targetProf,
        };
      } else {
        const newAtt: Attendance = {
          id: `att-${Date.now()}`,
          training_id: training.id,
          user_id: targetUserId,
          status: newStatus,
          reason: null,
          updated_at: new Date().toISOString(),
          profile: targetProf,
        };
        updatedList.push(newAtt);
      }

      saveDemoState(training, updatedList);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(
          {
            training_id: training.id,
            user_id: targetUserId,
            status: newStatus,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'training_id,user_id' }
        )
        .select('*, profile:profiles(*)');

      if (error) {
        alert('Chyba pri ukladaní dochádzky: ' + error.message);
        return;
      }

      if (data && data[0]) {
        setAttendances((prev) => {
          const filtered = prev.filter((a) => a.user_id !== targetUserId);
          return [...filtered, data[0]];
        });
      }
    } catch (err: any) {
      alert('Chyba: ' + err.message);
    }
  };

  // Prepnutie stavu Koná sa / Zrušený (Tréner)
  const handleToggleTrainingStatus = async () => {
    if (!training || !isTrener) return;
    const newStatus: TrainingStatus = training.status === 'scheduled' ? 'cancelled' : 'scheduled';

    if (!isSupabaseConfigured || isDemo) {
      const updated = { ...training, status: newStatus };
      saveDemoState(updated, attendances);
      return;
    }

    try {
      const { error } = await supabase
        .from('trainings')
        .update({ status: newStatus })
        .eq('id', training.id);

      if (error) throw error;
      setTraining((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err: any) {
      alert('Chyba pri zmene stavu: ' + err.message);
    }
  };

  // Úprava tréningu z modalu
  const handleSaveTrainingModal = async (data: {
    id?: string;
    title: string;
    date_time: string;
    location: string;
    notes: string;
    status: TrainingStatus;
  }) => {
    if (!training) return;

    if (!isSupabaseConfigured || isDemo) {
      const updated: Training = {
        ...training,
        title: data.title,
        date_time: data.date_time,
        location: data.location,
        notes: data.notes || null,
        status: data.status,
      };
      saveDemoState(updated, attendances);
      return;
    }

    try {
      const { error } = await supabase
        .from('trainings')
        .update({
          title: data.title,
          date_time: data.date_time,
          location: data.location,
          notes: data.notes || null,
          status: data.status,
        })
        .eq('id', training.id);

      if (error) throw error;

      setTraining((prev) =>
        prev
          ? {
              ...prev,
              title: data.title,
              date_time: data.date_time,
              location: data.location,
              notes: data.notes || null,
              status: data.status,
            }
          : null
      );
    } catch (err: any) {
      alert('Chyba pri úprave: ' + err.message);
    }
  };

  // Zmazanie tréningu
  const handleDeleteTraining = async () => {
    if (!training) return;
    if (!isSupabaseConfigured || isDemo) {
      const savedTr = localStorage.getItem('demo_trainings');
      const allTr: Training[] = savedTr ? JSON.parse(savedTr) : MOCK_TRAININGS;
      const remainingTr = allTr.filter((t) => t.id !== training.id);
      localStorage.setItem('demo_trainings', JSON.stringify(remainingTr));
      router.push('/');
      return;
    }

    try {
      const { error } = await supabase.from('trainings').delete().eq('id', training.id);
      if (error) throw error;
      router.push('/');
    } catch (err: any) {
      alert('Chyba pri mazaní: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Načítavam detail tréningu...</p>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tréning sa nenašiel</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Späť na zoznam
        </Link>
      </div>
    );
  }

  // Prepojenie dochádzky
  const enrichedAttendances = attendances.map((a) => ({
    ...a,
    profile: a.profile || profiles.find((p) => p.id === a.user_id),
  }));

  const isSignedUp = user
    ? enrichedAttendances.some((a) => a.user_id === user.id && a.status === 'yes')
    : false;

  const signedUpMembers = enrichedAttendances.filter((a) => a.status === 'yes');
  const signedUpUserIds = new Set(signedUpMembers.map((a) => a.user_id));

  // Ostatní členovia, ktorí nie sú prihlásení
  const unSignedMembers = profiles.filter((p) => !signedUpUserIds.has(p.id));

  const trainingDate = new Date(training.date_time);
  const formattedDate = trainingDate.toLocaleDateString('sk-SK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = trainingDate.toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCancelled = training.status === 'cancelled';

  // Objekt pre Share Modal
  const trainingForShare: TrainingWithAttendance = {
    ...training,
    attendances: enrichedAttendances,
    counts: {
      yes: signedUpMembers.length,
      no: unSignedMembers.length,
      maybe: 0,
      unresponded: unSignedMembers.length,
      totalMembers: profiles.length || 10,
    },
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Všetky tréningy
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            title="Zdieľať tréning"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {isTrener && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              title="Upraviť tréning"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Card with Training Information */}
      <div
        className={`bg-white dark:bg-slate-800/90 border rounded-3xl p-5 sm:p-7 shadow-lg ${
          isCancelled
            ? 'border-red-300 bg-red-50/50 dark:border-red-500/50 dark:bg-red-950/15'
            : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-xl">
            Detail Tréningu
          </span>

          {/* Status Badge */}
          {isCancelled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 text-xs font-bold border border-red-200 dark:border-red-500/40">
              <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
              Tréning je ZRUŠENÝ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Tréning sa KONÁ
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 leading-tight">
          {training.title}
        </h1>

        {/* Date, Time & Location grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Dátum a čas</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">{formattedDate}</span>
              <span className="block text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                Začiatok: {formattedTime}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Miesto konania</span>
              <span className="font-semibold text-slate-900 dark:text-white">{training.location}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  training.location
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-sky-600 dark:text-sky-400 hover:underline mt-0.5 font-medium"
              >
                Otvoriť v Google Mapách &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Pokyny / Poznámky trénera */}
        {training.notes && (
          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Pokyny trénera pre členov:
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {training.notes}
            </p>
          </div>
        )}

        {/* Tréner Quick Actions (Zrušiť / Obnoviť) */}
        {isTrener && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={handleToggleTrainingStatus}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isCancelled
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                  : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40'
              }`}
            >
              {isCancelled ? '✓ Obnoviť tréning (Koná sa)' : '✕ Zrušiť tento tréning'}
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 underline font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Zdieľať na WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Jediné prepínacie tlačidlo: Prihlásiť sa / Odhlásiť sa */}
      {!isCancelled && (
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tvoja osobná účasť</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSignedUp
                  ? 'Si úspešne prihlásený na tento tréning'
                  : 'Zatiaľ nie si prihlásený na tento tréning'}
              </p>
            </div>
            {isSignedUp && (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Prihlásený
              </span>
            )}
          </div>

          <button
            onClick={() => user && handleToggleAttendance(user.id, !isSignedUp)}
            className={`w-full py-3.5 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
              isSignedUp
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.99]'
            }`}
          >
            {isSignedUp ? (
              <>
                <LogOut className="w-4 h-4" />
                Odhlásiť sa z tréningu
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Prihlásiť sa na tréning
              </>
            )}
          </button>
        </div>
      )}

      {/* Súpiska prihlásených členov */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/80 mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Prihlásení členovia ({signedUpMembers.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Zoznam všetkých členov tímu, ktorí potvrdili účasť na tomto tréningu
            </p>
          </div>
        </div>

        {signedUpMembers.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            Zatiaľ nie je prihlásený žiadny člen tímu.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {signedUpMembers.map((item) => (
              <div
                key={item.id}
                className="py-3 px-3 flex items-center justify-between rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
                    {item.profile?.full_name ? item.profile.full_name.charAt(0) : 'Č'}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      {item.profile?.full_name || 'Člen'}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Prihlásený
                    </span>
                  </div>
                </div>

                {isTrener && (
                  <button
                    onClick={() => handleToggleAttendance(item.user_id, false)}
                    className="text-xs px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30 rounded-lg transition-colors font-medium border border-rose-200 dark:border-rose-500/30"
                    title="Odhlásiť člena z tréningu"
                  >
                    Odhlásiť
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pre trénera: Zoznam neprihlásených členov s možnosťou ich manuálne prihlásiť */}
        {isTrener && unSignedMembers.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Neprihlásení členovia ({unSignedMembers.length})
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {unSignedMembers.map((member) => (
                <div
                  key={member.id}
                  className="py-2.5 px-3 flex items-center justify-between rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                      {member.full_name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                        {member.full_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Zatiaľ neprihlásený
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAttendance(member.id, true)}
                    className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 rounded-lg transition-colors font-medium border border-emerald-200 dark:border-emerald-500/30"
                    title="Manuálne prihlásiť člena"
                  >
                    + Prihlásiť
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modaly */}
      <TrainingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTrainingModal}
        onDelete={handleDeleteTraining}
        trainingToEdit={training}
      />

      <ShareTrainingModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        training={trainingForShare}
      />
    </div>
  );
}
