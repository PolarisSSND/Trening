'use client';

import React from 'react';
import Link from 'next/link';
import { TrainingWithAttendance } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Share2,
  ChevronRight,
  AlertTriangle,
  FileText,
  LogOut,
  Users,
} from 'lucide-react';

interface TrainingCardProps {
  training: TrainingWithAttendance;
  onToggleAttendance: (trainingId: string, shouldSignUp: boolean) => void;
  onShare: (training: TrainingWithAttendance) => void;
  onEdit?: (training: TrainingWithAttendance) => void;
}

export default function TrainingCard({
  training,
  onToggleAttendance,
  onShare,
  onEdit,
}: TrainingCardProps) {
  const { isTrener } = useAuth();

  const trainingDate = new Date(training.date_time);
  const isPast = trainingDate.getTime() < Date.now();
  const isCancelled = training.status === 'cancelled';

  // Formátovanie dátumu
  const formattedDate = trainingDate.toLocaleDateString('sk-SK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formattedTime = trainingDate.toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Overenie, či je aktuálny používateľ prihlásený
  const isSignedUp = training.myAttendance?.status === 'yes';

  // Zoznam prihlásených členov
  const signedUpMembers = training.attendances.filter((a) => a.status === 'yes');

  return (
    <div
      className={`relative bg-white dark:bg-slate-800/90 border rounded-2xl p-4 sm:p-5 transition-all shadow-sm ${
        isCancelled
          ? 'border-red-300 bg-red-50/50 dark:border-red-500/40 dark:bg-red-950/10'
          : isPast
          ? 'border-slate-200 dark:border-slate-700/60 opacity-80'
          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:shadow-md'
      }`}
    >
      {/* Top Header: Date badge + Status + Share */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold text-xs capitalize">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate} • {formattedTime}
          </span>

          {isCancelled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-500/40">
              <AlertTriangle className="w-3.5 h-3.5" />
              Zrušený
            </span>
          ) : isPast ? (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-700/80 dark:text-slate-300 text-xs">
              Ukončený
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Koná sa
            </span>
          )}
        </div>

        {/* Share & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onShare(training)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/70 transition-colors"
            title="Zdieľať tréning na WhatsApp / skopírovať prehľad"
            aria-label="Zdieľať tréning"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <Link href={`/trainings/${training.id}`} className="group block">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
          <span>{training.title}</span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
        </h3>
      </Link>

      {/* Location */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            training.location
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 truncate"
        >
          {training.location}
        </a>
      </div>

      {/* Notes preview */}
      {training.notes && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-lg p-2 border border-slate-200 dark:border-slate-800">
          <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed">{training.notes}</p>
        </div>
      )}

      {/* Jediné prepínacie tlačidlo: Prihlásiť sa / Odhlásiť sa */}
      {!isPast && !isCancelled && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <button
            onClick={() => onToggleAttendance(training.id, !isSignedUp)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
              isSignedUp
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.99]'
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

      {/* Zoznam prihlásených členov pod tlačidlom */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Prihlásení členovia ({signedUpMembers.length}):
          </span>
          <Link
            href={`/trainings/${training.id}`}
            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Všetky podrobnosti &rarr;
          </Link>
        </div>

        {signedUpMembers.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
            Zatiaľ nie je prihlásený žiadny člen.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
            {signedUpMembers.map((att) => (
              <span
                key={att.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {att.profile?.full_name || 'Člen'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tréner Quick Edit button */}
      {isTrener && onEdit && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onEdit(training)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline decoration-slate-300 dark:decoration-slate-600 hover:decoration-emerald-500"
          >
            Spravovať tréning &gt;
          </button>
        </div>
      )}
    </div>
  );
}
