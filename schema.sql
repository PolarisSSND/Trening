-- ==============================================================================
-- SPORT CLUB & TEAM TRAINING ATTENDANCE SYSTEM - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Tento skript skopírujte a spustite v Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABUĽKA PROFILES (Profily používateľov prepojené na auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'clen' CHECK (role IN ('trener', 'clen')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pre rýchle vyhľadávanie
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. TABUĽKA TRAININGS (Tréningy)
CREATE TABLE IF NOT EXISTS public.trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date_time TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pre radenie podľa dátumu
CREATE INDEX IF NOT EXISTS idx_trainings_date_time ON public.trainings(date_time DESC);

-- 4. TABUĽKA ATTENDANCE (Dochádzka)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'maybe' CHECK (status IN ('yes', 'no', 'maybe')),
    reason TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_training_user UNIQUE (training_id, user_id)
);

-- Indexy pre rýchle filtrovanie dochádzky
CREATE INDEX IF NOT EXISTS idx_attendance_training_id ON public.attendance(training_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);

-- 5. TABUĽKA ANNOUNCEMENTS (Tímové oznamy a notifikácie)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    training_id UUID REFERENCES public.trainings(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

-- ==============================================================================
-- 6. POMOCNÉ FUNKCIE (SECURITY DEFINER - zabraňujú rekurzii v RLS)
-- ==============================================================================

-- Funkcia pre overenie, či je volajúci používateľ tréner
CREATE OR REPLACE FUNCTION public.is_trener(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = check_user_id AND role = 'trener'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Automatické aktualizovanie updated_at pre attendance
CREATE OR REPLACE FUNCTION public.set_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_attendance_updated_at ON public.attendance;
CREATE TRIGGER trigger_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.set_attendance_updated_at();

-- ==============================================================================
-- 7. TRIGGER PRE AUTOMATICKÉ VYTVORENIE PROFILU PRI REGISTRÁCII CEZ AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
BEGIN
    -- Získanie roly z metadát pri registrácii, default 'clen'
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'clen');
    IF user_role NOT IN ('trener', 'clen') THEN
        user_role := 'clen';
    END IF;

    -- Získanie celého mena z metadát alebo z časti pred zavináčom
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (id, email, full_name, role, created_at)
    VALUES (NEW.id, NEW.email, user_name, user_role, now())
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLITIKY
-- ==============================================================================

-- Zapnutie RLS pre všetky tabuľky
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS pre: PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_all_authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "profiles_update_own_or_coach" ON public.profiles;
CREATE POLICY "profiles_update_own_or_coach"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_trener());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id OR public.is_trener());

-- ------------------------------------------------------------------------------
-- RLS pre: TRAININGS
-- ------------------------------------------------------------------------------
-- Čítanie tréningov povolené pre všetkých prihlásených
DROP POLICY IF EXISTS "trainings_select_all_authenticated" ON public.trainings;
CREATE POLICY "trainings_select_all_authenticated"
    ON public.trainings FOR SELECT
    TO authenticated
    USING (true);

-- Vytváranie tréningov iba pre trénera
DROP POLICY IF EXISTS "trainings_insert_coach_only" ON public.trainings;
CREATE POLICY "trainings_insert_coach_only"
    ON public.trainings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_trener());

-- Úprava tréningov iba pre trénera
DROP POLICY IF EXISTS "trainings_update_coach_only" ON public.trainings;
CREATE POLICY "trainings_update_coach_only"
    ON public.trainings FOR UPDATE
    TO authenticated
    USING (public.is_trener())
    WITH CHECK (public.is_trener());

-- Zmazanie tréningov iba pre trénera
DROP POLICY IF EXISTS "trainings_delete_coach_only" ON public.trainings;
CREATE POLICY "trainings_delete_coach_only"
    ON public.trainings FOR DELETE
    TO authenticated
    USING (public.is_trener());

-- ------------------------------------------------------------------------------
-- RLS pre: ATTENDANCE
-- ------------------------------------------------------------------------------
-- Čítanie dochádzky povolené pre všetkých prihlásených
DROP POLICY IF EXISTS "attendance_select_all_authenticated" ON public.attendance;
CREATE POLICY "attendance_select_all_authenticated"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (true);

-- Vytvorenie dochádzky: samotný člen alebo tréner
DROP POLICY IF EXISTS "attendance_insert_own_or_coach" ON public.attendance;
CREATE POLICY "attendance_insert_own_or_coach"
    ON public.attendance FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_trener());

-- Úprava dochádzky: samotný člen alebo tréner
DROP POLICY IF EXISTS "attendance_update_own_or_coach" ON public.attendance;
CREATE POLICY "attendance_update_own_or_coach"
    ON public.attendance FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_trener())
    WITH CHECK (auth.uid() = user_id OR public.is_trener());

-- Zmazanie dochádzky: samotný člen alebo tréner
DROP POLICY IF EXISTS "attendance_delete_own_or_coach" ON public.attendance;
CREATE POLICY "attendance_delete_own_or_coach"
    ON public.attendance FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_trener());

-- ------------------------------------------------------------------------------
-- RLS pre: ANNOUNCEMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "announcements_select_all_authenticated" ON public.announcements;
CREATE POLICY "announcements_select_all_authenticated"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "announcements_insert_coach_only" ON public.announcements;
CREATE POLICY "announcements_insert_coach_only"
    ON public.announcements FOR INSERT
    TO authenticated
    WITH CHECK (public.is_trener());

DROP POLICY IF EXISTS "announcements_update_coach_only" ON public.announcements;
CREATE POLICY "announcements_update_coach_only"
    ON public.announcements FOR UPDATE
    TO authenticated
    USING (public.is_trener())
    WITH CHECK (public.is_trener());

DROP POLICY IF EXISTS "announcements_delete_coach_only" ON public.announcements;
CREATE POLICY "announcements_delete_coach_only"
    ON public.announcements FOR DELETE
    TO authenticated
    USING (public.is_trener());

-- ==============================================================================
-- 9. REALTIME AKTIVÁCIA (PRE LIVE AKTUALIZÁCIE V APLIKÁCII)
-- ==============================================================================
-- Umožňuje okamžité preklopenie zmien v tréningoch a dochádzke bez nutnosti refresha
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'trainings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.trainings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'attendance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'announcements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
    END IF;
END $$;

-- ==============================================================================
-- TIP PRE NASTAVENIE PRVÉHO TRÉNERA:
-- Po registrácii vášho účtu v aplikácii môžete spustiť tento riadok s vaším emailom:
-- UPDATE public.profiles SET role = 'trener' WHERE email = 'vas-email@priklad.sk';
-- ==============================================================================
