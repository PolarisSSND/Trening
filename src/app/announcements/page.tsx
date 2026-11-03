'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { Announcement, Training } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_ANNOUNCEMENTS, MOCK_TRAININGS } from '@/lib/mockData';
import AnnouncementModal from '@/components/AnnouncementModal';
import {
  Bell,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';

export default function AnnouncementsPage() {
  const { user, isTrener, isDemo } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnnouncements() {
      setLoading(true);
      if (!isSupabaseConfigured || isDemo) {
        const saved = localStorage.getItem('demo_announcements');
        setAnnouncements(saved ? JSON.parse(saved) : MOCK_ANNOUNCEMENTS);
        setTrainings(MOCK_TRAININGS);
        setLoading(false);
        return;
      }

      try {
        const [annRes, trRes] = await Promise.all([
          supabase.from('announcements').select('*').order('created_at', { ascending: false }),
          supabase.from('trainings').select('*'),
        ]);

        if (annRes.data) setAnnouncements(annRes.data);
        if (trRes.data) setTrainings(trRes.data);
      } catch (err) {
        console.error(err);
        setAnnouncements(MOCK_ANNOUNCEMENTS);
        setTrainings(MOCK_TRAININGS);
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, [isDemo]);

  const saveDemoState = (updated: Announcement[]) => {
    setAnnouncements(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_announcements', JSON.stringify(updated));
    }
  };

  const handleCreateAnnouncement = async (data: {
    title: string;
    content: string;
    training_id?: string | null;
  }) => {
    if (!user) return;

    if (!isSupabaseConfigured || isDemo) {
      const newAnn: Announcement = {
        id: `ann-${Date.now()}`,
        title: data.title,
        content: data.content,
        training_id: data.training_id || null,
        created_by: user.id,
        author_name: user.full_name,
        created_at: new Date().toISOString(),
      };
      saveDemoState([newAnn, ...announcements]);
      return;
    }

    try {
      const { error } = await supabase.from('announcements').insert({
        title: data.title,
        content: data.content,
        training_id: data.training_id || null,
        created_by: user.id,
      });

      if (error) throw error;

      const { data: refreshed } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (refreshed) setAnnouncements(refreshed);
    } catch (err: any) {
      alert('Chyba pri ukladaní oznamu: ' + err.message);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!isTrener) return;
    if (!window.confirm('Naozaj chcete odstrániť toto upozornenie?')) return;

    if (!isSupabaseConfigured || isDemo) {
      const updated = announcements.filter((a) => a.id !== id);
      saveDemoState(updated);
      return;
    }

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert('Chyba pri mazaní: ' + err.message);
    }
  };

  const handleShare = async (ann: Announcement) => {
    const text = `📢 ${ann.title}\n\n${ann.content}\n\nOdoslal: ${ann.author_name || 'Tréner'}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ann.title,
          text: text,
        });
        return;
      } catch (e) {}
    }
    await navigator.clipboard.writeText(text);
    setCopiedId(ann.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
              Tímová Nástenka
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
              Oznamy & Upozornenia
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
              Oficiálne správy, organizačné zmeny a dôležité notifikácie od trénera pre celý klub.
            </p>
          </div>

          {isTrener && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm px-4 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              Nové upozornenie
            </button>
          )}
        </div>
      </div>

      {/* Zoznam oznamov */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Načítavam oznamy tímu...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Žiadne aktuálne oznamy</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Všetky dôležité informácie od trénera sa zobrazia na tejto nástenke.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const date = new Date(ann.created_at);
            const formattedDate = date.toLocaleDateString('sk-SK', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={ann.id}
                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{ann.title}</h3>
                      <span className="text-[11px] text-slate-400">
                        {ann.author_name || 'Tréner'} • {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShare(ann)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                      title="Zdieľať oznam"
                    >
                      {copiedId === ann.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    {isTrener && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/60 transition-colors"
                        title="Odstrániť oznam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pl-10 mt-1">
                  {ann.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateAnnouncement}
        trainings={trainings}
      />
    </div>
  );
}
