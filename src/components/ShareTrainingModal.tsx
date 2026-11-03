'use client';

import React, { useState } from 'react';
import { TrainingWithAttendance } from '@/lib/types';
import { X, Copy, Check, MessageSquare, Share2 } from 'lucide-react';

interface ShareTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  training: TrainingWithAttendance | null;
}

export default function ShareTrainingModal({
  isOpen,
  onClose,
  training,
}: ShareTrainingModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !training) return null;

  const trainingDate = new Date(training.date_time);
  const formattedDate = trainingDate.toLocaleDateString('sk-SK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = trainingDate.toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const yesPlayers = training.attendances
    .filter((a) => a.status === 'yes')
    .map((a) => a.profile?.full_name || 'Hráč')
    .join(', ');

  const noPlayers = training.attendances
    .filter((a) => a.status === 'no')
    .map((a) => `${a.profile?.full_name || 'Hráč'}${a.reason ? ` (${a.reason})` : ''}`)
    .join(', ');

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/trainings/${training.id}` : '';

  const shareText = `🏃‍♂️ *TRÉNING: ${training.title.toUpperCase()}*
📅 *Kedy:* ${formattedDate} o ${formattedTime}
📍 *Miesto:* ${training.location}
${training.status === 'cancelled' ? '⚠️ *POZOR: TENTO TRÉNING JE ZRUŠENÝ!*\n' : ''}
${training.notes ? `📝 *Pokyny:* ${training.notes}\n` : ''}
✅ *Prídu (${training.counts.yes}):* ${yesPlayers || 'Zatiaľ nikto'}
${noPlayers ? `❌ *Ospravedlnení (${training.counts.no}):* ${noPlayers}\n` : ''}
📲 *Potvrď účasť v aplikácii:*
${currentUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: training.title,
          text: shareText,
          url: currentUrl,
        });
      } catch (err) {
        // Ignorovať ak používateľ zrušil dialóg
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Zdieľať tréning s tímom</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text preview */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Náhľad správy (pripravená na odoslanie):
          </label>
          <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
            {shareText}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          {/* WhatsApp button */}
          <button
            onClick={handleWhatsApp}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30"
          >
            <MessageSquare className="w-4 h-4" />
            Odoslať na WhatsApp
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Skopírované do schránky!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Skopírovať text pre tím
              </>
            )}
          </button>

          {/* Native mobile share if supported */}
          {typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              Iné aplikácie v telefóne (SMS, Messenger, Slack...)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
