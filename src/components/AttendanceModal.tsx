'use client';

import React, { useState, useEffect } from 'react';
import { AttendanceStatus, Profile } from '@/lib/types';
import { X, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: AttendanceStatus, reason: string) => Promise<void>;
  initialStatus?: AttendanceStatus;
  initialReason?: string;
  targetUserName?: string;
  isCoachEditingOther?: boolean;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  onConfirm,
  initialStatus = 'no',
  initialReason = '',
  targetUserName,
  isCoachEditingOther = false,
}: AttendanceModalProps) {
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [reason, setReason] = useState(initialReason);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
    setReason(initialReason || '');
  }, [initialStatus, initialReason, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(status, reason.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickReasons = [
    'Práca / škola',
    'Zranenie / choroba',
    'Rodinné dôvody',
    'Dovolenka',
    'Doprava',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isCoachEditingOther
                ? `Zmena dochádzky: ${targetUserName || 'Člen'}`
                : status === 'no'
                ? 'Ospravedlniť sa z tréningu'
                : 'Zadať stav dochádzky'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isCoachEditingOther
                ? 'Ako tréner môžete manuálne upraviť dochádzku hráča'
                : 'Uveďte dôvod vašej neúčasti pre trénera'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Status selector (ak tréner upravuje iného hráča alebo si hráč mení status) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Stav dochádzky:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('yes')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                  status === 'yes'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Príde
              </button>

              <button
                type="button"
                onClick={() => setStatus('maybe')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                  status === 'maybe'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Možno
              </button>

              <button
                type="button"
                onClick={() => setStatus('no')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                  status === 'no'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                Nepríde
              </button>
            </div>
          </div>

          {/* Dôvod (obzvlášť dôležité pri Neprídem alebo Možno) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dôvod neúčasti {status === 'no' ? '(odporúčané)' : '(voliteľné)'}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="napr. Pracovná zmena, Zranený členok..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Rýchle šablóny dôvodov */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>

          {/* Tlačidlá */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isSubmitting ? 'Ukladám...' : 'Potvrdiť'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
