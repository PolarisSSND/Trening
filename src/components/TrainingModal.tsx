'use client';

import React, { useState, useEffect } from 'react';
import { Training, TrainingStatus } from '@/lib/types';
import { X, Calendar, MapPin, FileText, Trash2, CheckCircle2 } from 'lucide-react';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trainingData: {
    id?: string;
    title: string;
    date_time: string;
    location: string;
    notes: string;
    status: TrainingStatus;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  trainingToEdit?: Training | null;
}

export default function TrainingModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  trainingToEdit,
}: TrainingModalProps) {
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TrainingStatus>('scheduled');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (trainingToEdit) {
      setTitle(trainingToEdit.title);
      const d = new Date(trainingToEdit.date_time);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDateTime(localIso);
      setLocation(trainingToEdit.location);
      setNotes(trainingToEdit.notes || '');
      setStatus(trainingToEdit.status);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setTitle('Pravidelný tréning');
      setDateTime(localIso);
      setLocation('Mestská športová hala');
      setNotes('');
      setStatus('scheduled');
    }
  }, [trainingToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateTime || !location) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: trainingToEdit?.id,
        title,
        date_time: new Date(dateTime).toISOString(),
        location,
        notes,
        status,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!trainingToEdit || !onDelete) return;
    if (window.confirm('Naozaj chcete zmazať tento tréning a celú jeho dochádzku?')) {
      setIsSubmitting(true);
      try {
        await onDelete(trainingToEdit.id);
        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {trainingToEdit ? 'Upraviť tréning' : 'Vytvoriť nový tréning'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick templates for title */}
        {!trainingToEdit && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Šablóny:</span>
            {['Kondičný tréning', 'Herná taktika', 'Predzápasový tréning', 'Regenerácia'].map(
              (template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => setTitle(template)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {template}
                </button>
              )
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Názov */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Názov tréningu *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="napr. Kondičný tréning a taktika"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Dátum a čas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Dátum a začiatok tréningu *
            </label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Miesto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Miesto tréningu *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="napr. Mestská hala, Ihrisko 2"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Stav tréningu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stav tréningu
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('scheduled')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  status === 'scheduled'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Koná sa (Plánovaný)
              </button>

              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  status === 'cancelled'
                    ? 'bg-red-50 border-red-400 text-red-800 dark:bg-red-500/20 dark:border-red-500 dark:text-red-300 ring-2 ring-red-500/30'
                    : 'bg-slate-50 border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Zrušený
              </button>
            </div>
          </div>

          {/* Poznámky */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Pokyny a poznámka pre členov (voliteľné)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="napr. Nezabudnite si vziať chrániče a halovú obuv..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Tlačidlá */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            {trainingToEdit && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="p-2.5 rounded-xl bg-red-50 border border-red-200 dark:bg-red-500/15 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25 transition-colors text-xs font-semibold flex items-center gap-1"
                title="Zmazať tréning"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Zmazať</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors"
              >
                Zrušiť
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? 'Ukladám...' : trainingToEdit ? 'Uložiť zmeny' : 'Vytvoriť tréning'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
