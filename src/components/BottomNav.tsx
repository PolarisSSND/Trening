'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Bell, User } from 'lucide-react';

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
      label: 'Tím',
      href: '/team',
      icon: Users,
      active: pathname === '/team',
    },
    {
      label: 'Oznamy',
      href: '/announcements',
      icon: Bell,
      active: pathname === '/announcements',
    },
    {
      label: 'Profil',
      href: '/profile',
      icon: User,
      active: pathname === '/profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                item.active
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.active && (
                <span className="absolute top-0 w-8 h-1 bg-emerald-500 rounded-b-full shadow-sm shadow-emerald-500/50" />
              )}
              <Icon className={`w-5 h-5 ${item.active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
