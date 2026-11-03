'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, UserRole } from './types';
import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_PROFILES } from './mockData';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isTrener: boolean;
  isLoading: boolean;
  isDemo: boolean;
  login: (email: string, password?: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (newRole: UserRole) => void;
  updateProfileName: (newName: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(!isSupabaseConfigured);

  // Inicializácia prihlásenia
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        // Použiť predvoleného trénera ako demo používateľa pre okamžité testovanie
        const savedDemoId = typeof window !== 'undefined' ? localStorage.getItem('demo_user_id') : null;
        const initialUser = MOCK_PROFILES.find((p) => p.id === savedDemoId) || MOCK_PROFILES[0];
        if (mounted) {
          setUser(initialUser);
          setIsDemo(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Načítanie profilu zo Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (mounted) {
            if (profile) {
              setUser(profile);
            } else {
              // Ak ešte profil nevznikol, vytvoríme dočasný z auth metadát
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Užívateľ',
                role: (session.user.user_metadata?.role as UserRole) || 'clen',
                created_at: new Date().toISOString(),
              });
            }
            setIsDemo(false);
          }
        } else {
          // Nie je prihlásený, ponúkneme demo používateľa pre jednoduché prehliadanie
          const savedDemoId = typeof window !== 'undefined' ? localStorage.getItem('demo_user_id') : null;
          const initialUser = MOCK_PROFILES.find((p) => p.id === savedDemoId) || MOCK_PROFILES[0];
          if (mounted) {
            setUser(initialUser);
            setIsDemo(true);
          }
        }
      } catch (err) {
        console.error('Chyba pri overovaní relácie:', err);
        if (mounted) {
          setUser(MOCK_PROFILES[0]);
          setIsDemo(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Počúvanie na zmeny auth stavu v Supabase
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser(
            profile || {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || 'Užívateľ',
              role: (session.user.user_metadata?.role as UserRole) || 'clen',
              created_at: new Date().toISOString(),
            }
          );
          setIsDemo(false);
        } else {
          setUser(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Prihlásenie
  const login = async (email: string, password?: string) => {
    if (!isSupabaseConfigured || isDemo) {
      // Demo prihlásenie podľa emailu
      const found = MOCK_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser(found);
        localStorage.setItem('demo_user_id', found.id);
        return {};
      }
      // Vytvorenie nového demo účtu
      const newMock: Profile = {
        id: `mock-${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        role: 'clen',
        created_at: new Date().toISOString(),
      };
      setUser(newMock);
      localStorage.setItem('demo_user_id', newMock.id);
      return {};
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '',
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Nepodarilo sa prihlásiť' };
    }
  };

  // Registrácia
  const signup = async (email: string, password: string, fullName: string, role: UserRole) => {
    if (!isSupabaseConfigured || isDemo) {
      const newMock: Profile = {
        id: `mock-${Date.now()}`,
        email,
        full_name: fullName,
        role,
        created_at: new Date().toISOString(),
      };
      setUser(newMock);
      localStorage.setItem('demo_user_id', newMock.id);
      return {};
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Chyba registrácie' };
    }
  };

  // Odhlásenie
  const logout = async () => {
    if (isSupabaseConfigured && !isDemo) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('demo_user_id');
    setUser(null);
  };

  // Rýchle prepnutie roly v demo režime (pre testovanie oboch pohľadov)
  const switchDemoRole = (newRole: UserRole) => {
    if (newRole === 'trener') {
      const coach = MOCK_PROFILES.find((p) => p.role === 'trener') || MOCK_PROFILES[0];
      setUser(coach);
      localStorage.setItem('demo_user_id', coach.id);
    } else {
      const player = MOCK_PROFILES.find((p) => p.role === 'clen') || MOCK_PROFILES[1];
      setUser(player);
      localStorage.setItem('demo_user_id', player.id);
    }
  };

  // Zmena mena
  const updateProfileName = async (newName: string) => {
    if (!user) return { error: 'Neprihlásený' };

    if (!isSupabaseConfigured || isDemo) {
      setUser({ ...user, full_name: newName });
      return {};
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName })
      .eq('id', user.id);

    if (error) return { error: error.message };
    setUser({ ...user, full_name: newName });
    return {};
  };

  const role: UserRole = user?.role || 'clen';
  const isTrener = role === 'trener';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isTrener,
        isLoading,
        isDemo,
        login,
        signup,
        logout,
        switchDemoRole,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
