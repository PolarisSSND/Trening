'use client';

import React from 'react';
import Link from 'next/link';
import { TrainingWithAttendance, AttendanceStatus } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Share2,
  ChevronRight,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface TrainingCardProps {
  training: TrainingWithAttendance;
  onUpdateAttendance: (trainingId: string, status: AttendanceStatus, reason?: string) => void;
  onOpenReasonModal: (trainingId: string) => void;
  onShare: (training: TrainingWithAttendance) => void;
  onEdit?: (training: TrainingWithAttendance) => void;
}

export default function TrainingCard({
  training,
  onUpdateAttendance,
  onOpenReasonModal,
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

  const myStatus = training.myAttendance?.status;

  return (
    <div
      className={`relative bg-slate-800/90 dark:bg-slate-800/90 border rounded-2xl p-4 sm:p-5 transition-all shadow-sm ${
        isCancelled
          ? 'border-red-500/40 bg-red-950/10'
          : isPast
          ? 'border-slate-700/60 opacity-85'
          : 'border-slate-700 hover:border-emerald-500/50 hover:shadow-emerald-500/5'
      }`}
    >
      {/* Top Header: Date badge + Status + Share */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-xs capitalize">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate} • {formattedTime}
          </span>

          {isCancelled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/40">
              <AlertTriangle className="w-3.5 h-3.5" />
              Zrušený
            </span>
          ) : isPast ? (
            <span className="px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-300 text-xs">
              Ukončený
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Koná sa
            </span>
          )}
        </div>

        {/* Share & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onShare(training)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
            title="Zdieľať na WhatsApp / skopírovať prehľad"
            aria-label="Zdieľať tréning"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <Link href={`/trainings/${training.id}`} className="group block">
        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
          <span>{training.title}</span>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </h3>
      </Link>

      {/* Location */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            training.location
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline hover:text-emerald-400 truncate"
        >
          {training.location}
        </a>
      </div>

      {/* Notes preview */}
      {training.notes && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400 bg-slate-900/40 rounded-lg p-2 border border-slate-800">
          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed">{training.notes}</p>
        </div>
      )}

      {/* Attendance Counters Bar */}
      <div className="mt-4 pt-3 border-t border-slate-700/60">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Účasť tímu:</span>
          <Link
            href={`/trainings/${training.id}`}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Zobraziť súpisku ({training.counts.yes}/{training.counts.totalMembers})
          </Link>
        </div>

        {/* Badges pills */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-1 px-1.5">
            <span className="block font-bold text-emerald-400 text-sm">
              {training.counts.yes}
            </span>
            <span className="text-[10px] text-emerald-300/80">Príde</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg py-1 px-1.5">
            <span className="block font-bold text-amber-400 text-sm">
              {training.counts.maybe}
            </span>
            <span className="text-[10px] text-amber-300/80">Možno</span>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg py-1 px-1.5">
            <span className="block font-bold text-rose-400 text-sm">
              {training.counts.no}
            </span>
            <span className="text-[10px] text-rose-300/80">Nepríde</span>
          </div>

          <div className="bg-slate-700/30 border border-slate-700 rounded-lg py-1 px-1.5">
            <span className="block font-bold text-slate-400 text-sm">
              {training.counts.unresponded}
            </span>
            <span className="text-[10px] text-slate-400/80">Bez odp.</span>
          </div>
        </div>
      </div>

      {/* Player quick attendance selection */}
      {!isPast && !isCancelled && (
        <div className="mt-4 pt-3 border-t border-slate-700/60">
          <div className="text-xs text-slate-300 font-medium mb-2 flex items-center justify-between">
            <span>Tvoja dochádzka:</span>
            {training.myAttendance?.reason && (
              <span className="text-[11px] text-slate-400 italic truncate max-w-[160px]">
                Dôvod: {training.myAttendance.reason}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Prídem */}
            <button
              onClick={() => onUpdateAttendance(training.id, 'yes')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                myStatus === 'yes'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Prídem
            </button>

            {/* Možno */}
            <button
              onClick={() => onUpdateAttendance(training.id, 'maybe')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                myStatus === 'maybe'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-amber-500/20 hover:text-amber-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Možno
            </button>

            {/* Neprídem */}
            <button
              onClick={() => onOpenReasonModal(training.id)}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                myStatus === 'no'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Neprídem
            </button>
          </div>
        </div>
      )}

      {/* Tréner Quick Edit button */}
      {isTrener && onEdit && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onEdit(training)}
            className="text-xs text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-emerald-400"
          >
            Spravovať tréning &gt;
          </button>
        </div>
      )}
    </div>
  );
}
