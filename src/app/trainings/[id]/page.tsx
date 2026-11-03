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
import AttendanceModal from '@/components/AttendanceModal';
import ShareTrainingModal from '@/components/ShareTrainingModal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Share2,
  Edit,
  UserCheck,
  Shield,
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

  // Filter zoznamu dochádzky v detaile
  const [activeTab, setActiveTab] = useState<'yes' | 'maybe' | 'no' | 'unresponded'>('yes');

  // Modaly
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [coachTargetUser, setCoachTargetUser] = useState<Profile | null>(null);
  const [targetInitialStatus, setTargetInitialStatus] = useState<AttendanceStatus>('no');
  const [targetInitialReason, setTargetInitialReason] = useState<string>('');

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
  const handleUpdateAttendance = async (
    targetUserId: string,
    status: AttendanceStatus,
    reason: string = ''
  ) => {
    if (!training) return;

    if (!isSupabaseConfigured || isDemo) {
      const existingIdx = attendances.findIndex((a) => a.user_id === targetUserId);
      let updatedList = [...attendances];
      const targetProf = profiles.find((p) => p.id === targetUserId);

      if (existingIdx >= 0) {
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          status,
          reason: reason || null,
          updated_at: new Date().toISOString(),
          profile: targetProf,
        };
      } else {
        const newAtt: Attendance = {
          id: `att-${Date.now()}`,
          training_id: training.id,
          user_id: targetUserId,
          status,
          reason: reason || null,
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
            status,
            reason: reason || null,
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
        <p className="text-xs text-slate-400">Načítavam detail tréningu...</p>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">Tréning sa nenašiel</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
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

  const myAttendance = user ? enrichedAttendances.find((a) => a.user_id === user.id) : null;

  const yesList = enrichedAttendances.filter((a) => a.status === 'yes');
  const maybeList = enrichedAttendances.filter((a) => a.status === 'maybe');
  const noList = enrichedAttendances.filter((a) => a.status === 'no');

  // Hráči, ktorí ešte neodpovedali
  const respondedUserIds = new Set(enrichedAttendances.map((a) => a.user_id));
  const unrespondedProfiles = profiles.filter(
    (p) => !respondedUserIds.has(p.id) && p.role === 'clen'
  );

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
      yes: yesList.length,
      no: noList.length,
      maybe: maybeList.length,
      unresponded: unrespondedProfiles.length,
      totalMembers: profiles.length || 10,
    },
  };

  // Kliknutie trénera na zmenu dochádzky konkrétneho hráča
  const openCoachEditModal = (targetProf: Profile, currentStatus?: AttendanceStatus, currentReason?: string) => {
    setCoachTargetUser(targetProf);
    setTargetInitialStatus(currentStatus || 'yes');
    setTargetInitialReason(currentReason || '');
    setIsAttendanceModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Všetky tréningy
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Zdieľať tréning"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {isTrener && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Upraviť tréning"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Card with Training Information */}
      <div
        className={`bg-slate-800/90 border rounded-3xl p-5 sm:p-7 shadow-xl ${
          isCancelled ? 'border-red-500/50 bg-red-950/15' : 'border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
            Detail Tréningu
          </span>

          {/* Status Badge */}
          {isCancelled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/40">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Tréning je ZRUŠENÝ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tréning sa KONÁ
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight">
          {training.title}
        </h1>

        {/* Date, Time & Location grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <Calendar className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-slate-400 block font-medium">Dátum a čas</span>
              <span className="font-semibold text-white capitalize">{formattedDate}</span>
              <span className="block text-xs text-emerald-400 font-bold mt-0.5">
                Začiatok: {formattedTime}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-slate-400 block font-medium">Miesto konania</span>
              <span className="font-semibold text-white">{training.location}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  training.location
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-sky-400 hover:underline mt-0.5"
              >
                Otvoriť v Google Mapách &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Pokyny / Poznámky trénera */}
        {training.notes && (
          <div className="mt-4 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Pokyny trénera pre hráčov:
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {training.notes}
            </p>
          </div>
        )}

        {/* Tréner Quick Actions (Zrušiť / Obnoviť) */}
        {isTrener && (
          <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTrainingStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isCancelled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                }`}
              >
                {isCancelled ? '✓ Obnoviť tréning (Koná sa)' : '✕ Zrušiť tento tréning'}
              </button>
            </div>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Zdieľať na WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Tvoja Dochádzka (pre hráča / trénera) */}
      {!isCancelled && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Tvoja osobná dochádzka</h3>
              <p className="text-xs text-slate-400">
                {myAttendance
                  ? `Aktuálne: ${
                      myAttendance.status === 'yes'
                        ? 'Účasť potvrdená'
                        : myAttendance.status === 'maybe'
                        ? 'Možno prídeš'
                        : 'Ospravedlnený'
                    }`
                  : 'Ešte si nepotvrdil svoju účasť'}
              </p>
            </div>
            {myAttendance?.reason && (
              <span className="text-xs text-slate-400 italic bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                Dôvod: {myAttendance.reason}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => user && handleUpdateAttendance(user.id, 'yes')}
              className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                myAttendance?.status === 'yes'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Prídem
            </button>

            <button
              onClick={() => user && handleUpdateAttendance(user.id, 'maybe')}
              className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                myAttendance?.status === 'maybe'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-amber-500/20 hover:text-amber-300'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Možno
            </button>

            <button
              onClick={() => {
                if (user) {
                  openCoachEditModal(user, 'no', myAttendance?.reason || '');
                }
              }}
              className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                myAttendance?.status === 'no'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Neprídem
            </button>
          </div>
        </div>
      )}

      {/* Súpiska a Dochádzka Tímu */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Súpiska a dochádzka tímu
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Celkovo {yesList.length} z {profiles.length || 10} hráčov potvrdilo účasť
            </p>
          </div>

          {isTrener && (
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              Správca: Kliknutím zmeníte dochádzku hráčovi
            </span>
          )}
        </div>

        {/* Filtrovacie Taby s počtami */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs font-semibold mb-4 text-center">
          <button
            onClick={() => setActiveTab('yes')}
            className={`py-2 px-1 rounded-xl transition-all ${
              activeTab === 'yes'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prídu ({yesList.length})
          </button>

          <button
            onClick={() => setActiveTab('maybe')}
            className={`py-2 px-1 rounded-xl transition-all ${
              activeTab === 'maybe'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Možno ({maybeList.length})
          </button>

          <button
            onClick={() => setActiveTab('no')}
            className={`py-2 px-1 rounded-xl transition-all ${
              activeTab === 'no'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Neprídu ({noList.length})
          </button>

          <button
            onClick={() => setActiveTab('unresponded')}
            className={`py-2 px-1 rounded-xl transition-all ${
              activeTab === 'unresponded'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bez odp. ({unrespondedProfiles.length})
          </button>
        </div>

        {/* Zoznam položiek podľa vybratého tabu */}
        <div className="space-y-2">
          {activeTab === 'yes' && (
            <div>
              {yesList.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Zatiaľ nikto nepotvrdil účasť.
                </p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {yesList.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 px-3 flex items-center justify-between rounded-xl hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                          {item.profile?.full_name ? item.profile.full_name.charAt(0) : 'H'}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white block">
                            {item.profile?.full_name || 'Hráč'}
                          </span>
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Potvrdené
                          </span>
                        </div>
                      </div>

                      {isTrener && (
                        <button
                          onClick={() =>
                            item.profile &&
                            openCoachEditModal(item.profile, item.status, item.reason || '')
                          }
                          className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                        >
                          Zmeniť
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'maybe' && (
            <div>
              {maybeList.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Žiadny hráč neoznačil stav „Možno“.
                </p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {maybeList.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 px-3 flex items-center justify-between rounded-xl hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                          {item.profile?.full_name ? item.profile.full_name.charAt(0) : 'H'}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white block">
                            {item.profile?.full_name || 'Hráč'}
                          </span>
                          <span className="text-[11px] text-amber-400 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            {item.reason ? `Dôvod: ${item.reason}` : 'Možno'}
                          </span>
                        </div>
                      </div>

                      {isTrener && (
                        <button
                          onClick={() =>
                            item.profile &&
                            openCoachEditModal(item.profile, item.status, item.reason || '')
                          }
                          className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                        >
                          Zmeniť
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'no' && (
            <div>
              {noList.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Žiadny hráč sa neospravedlnil.
                </p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {noList.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 px-3 flex items-center justify-between rounded-xl hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-500/30">
                          {item.profile?.full_name ? item.profile.full_name.charAt(0) : 'H'}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white block">
                            {item.profile?.full_name || 'Hráč'}
                          </span>
                          <span className="text-[11px] text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {item.reason ? `Dôvod: ${item.reason}` : 'Nepríde (bez dôvodu)'}
                          </span>
                        </div>
                      </div>

                      {isTrener && (
                        <button
                          onClick={() =>
                            item.profile &&
                            openCoachEditModal(item.profile, item.status, item.reason || '')
                          }
                          className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                        >
                          Zmeniť
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'unresponded' && (
            <div>
              {unrespondedProfiles.length === 0 ? (
                <p className="text-xs text-emerald-400 py-6 text-center">
                  🎉 Všetci hráči už odpovedali na dochádzku!
                </p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {unrespondedProfiles.map((prof) => (
                    <div
                      key={prof.id}
                      className="py-2.5 px-3 flex items-center justify-between rounded-xl hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center">
                          {prof.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-300 block">
                            {prof.full_name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Zatiaľ neodpovedal
                          </span>
                        </div>
                      </div>

                      {isTrener && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateAttendance(prof.id, 'yes')}
                            className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors"
                            title="Označiť ako Príde"
                          >
                            + Príde
                          </button>
                          <button
                            onClick={() => openCoachEditModal(prof, 'no')}
                            className="text-xs px-2 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg transition-colors"
                            title="Označiť ako Nepríde s dôvodom"
                          >
                            - Nepríde
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modaly */}
      <TrainingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTrainingModal}
        onDelete={handleDeleteTraining}
        trainingToEdit={training}
      />

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onConfirm={async (status, reason) => {
          if (coachTargetUser) {
            await handleUpdateAttendance(coachTargetUser.id, status, reason);
          }
        }}
        initialStatus={targetInitialStatus}
        initialReason={targetInitialReason}
        targetUserName={coachTargetUser?.full_name}
        isCoachEditingOther={isTrener && coachTargetUser?.id !== user?.id}
      />

      <ShareTrainingModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        training={trainingForShare}
      />
    </div>
  );
}
