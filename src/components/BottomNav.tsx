'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Tréningy',
      href: '/',
      icon: Calendar,
      active: pathname === '/' || pathname.startsWith('/trainings'),
    },
    {
      label: 'Profil',
      href: '/profile',
      icon: User,
      active: pathname === '/profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)] shadow-lg shadow-black/5 dark:shadow-none">
      <div className="max-w-xs mx-auto grid grid-cols-2 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                item.active
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.active && (
                <span className="absolute top-0 w-12 h-1 bg-emerald-500 rounded-b-full shadow-sm shadow-emerald-500/50" />
              )}
              <Icon className={`w-5 h-5 ${item.active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-xs tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
