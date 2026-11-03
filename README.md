# ⚽ Športový Tím - Správa Tréningov a Dochádzky (PWA)

Kompletná responzívna webová a mobilná aplikácia vo forme **PWA (Progressive Web App)** na plánovanie tréningov, evidenciu dochádzky hráčov a klubovú komunikáciu.

Aplikácia je pripravená na okamžité nasadenie na bezplatný hosting **Vercel** alebo **Netlify** s automaticky vygenerovanou subdoménou (napr. `vas-klub.vercel.app`).

---

## 🚀 Hlavné Funkcie

### 👨‍💼 Pre Trénera (Správca / Admin):
- **Vytváranie a úprava tréningov:** Nastavenie dátumu, presného času, miesta konania (s priamym preklikom na Google Maps) a podrobných inštrukcií/poznámok pre hráčov.
- **Stav tréningu:** Možnosť prepínať medzi stavom **„Koná sa“** a **„Zrušený“** s okamžitým vizuálnym upozornením tímu.
- **Kompletný prehľad dochádzky:** Prehľadné zoznamy hráčov rozdelené do kategórií:
  - ✅ **Prídu** (potvrdená účasť)
  - ❓ **Možno** (neistá účasť)
  - ❌ **Neprídu** (ospravedlnení s uvedeným dôvodom)
  - ⏳ **Bez odpovede** (hráči, ktorí ešte nereagovali)
- **Manuálna zmena dochádzky:** Tréner môže kedykoľvek manuálne zmeniť dochádzku komukoľvek zo zoznamu.
- **Zdieľanie a notifikácie:** 
  - Generovanie predformátovanej správy na **WhatsApp / SMS** na 1 kliknutie.
  - Tímová nástenka pre publikovanie dôležitých oznamov a upozornení.
- **Správa členov:** Prehľad dochádzkovej štatistiky hráčov a možnosť meniť roly (povýšiť na trénera / zmeniť na hráča).

### 🏃‍♂️ Pre Člena (Hráč / Športovec):
- **Prehľad tréningov:** Prehľad nadchádzajúcich tréningov a história minulých tréningov.
- **Označenie účasti:** Voľba jedným klikom:
  - **„Prídem“**
  - **„Neprídem“** (s možnosťou zadať dôvod ospravedlnenia, napr. práca, zranenie)
  - **„Možno“**
- **Zoznam spoluhráčov:** Vidí, kto zo spoluhráčov na tréning príde, kto sa ospravedlnil a aká bude zostava.

### 📱 PWA & Mobilné funkcie:
- **Inštalovateľná na plochu:** Plnohodnotná podpora PWA pre **iOS (iPhone/iPad)** a **Android**.
- **Offline podpora:** Service Worker zabezpečuje caching statických assetov a offline informačnú obrazovku pri výpadku siete.
- **Mobile-First UX:** Spodný navigačný panel (Bottom Navigation Bar), prispôsobený pre ovládanie jednou rukou.
- **Tmavý & Svetlý režim (Dark/Light mode):** Automatická detekcia a manuálny prepínač s plynulými prechodmi.

---

## 🗄️ 1. Nastavenie Supabase Databázy (SQL Skripty)

V koreňovom adresári projektu sa nachádza súbor [`schema.sql`](file:///c:/Users/hroba/Downloads/zmazat/schema.sql).

### Postup aktivácie v Supabase:
1. Prihláste sa do [Supabase Dashboardu](https://supabase.com/dashboard).
2. Otvorte váš projekt (s heslom, ktoré ste zadali pri vytváraní).
3. V ľavom bočnom paneli kliknite na **SQL Editor**.
4. Kliknite na **New Query** (alebo **+**).
5. Skopírujte a vložte celý obsah súboru `schema.sql`.
6. Kliknite na zelené tlačidlo **Run** (Spustiť).

### Čo skript automaticky vytvorí:
- Tabuľku **`profiles`** (prepojenú na `auth.users` s rolami `'trener'` a `'clen'`).
- Tabuľku **`trainings`** (tréningy s dátumom, miestom, poznámkami a stavom `'scheduled'` / `'cancelled'`).
- Tabuľku **`attendance`** (dochádzka s unikátnym párom `training_id + user_id`, stavmi `'yes'`, `'no'`, `'maybe'` a dôvodom).
- Tabuľku **`announcements`** (tímové oznamy a notifikácie).
- **Trigger `handle_new_user`:** Pri každej novej registrácii automaticky vytvorí záznam v `profiles`.
- **Bezpečné RLS (Row Level Security) politiky:** Využívajú pomocnú funkciu `is_trener()` so `SECURITY DEFINER`, čím sa predchádza chybám nekonečnej rekurzie.
- **Supabase Realtime publikáciu** pre okamžité zobrazenie zmien na obrazovkách bez obnovenia stránky.

### Povýšenie vášho účtu na Trénera:
Po tom, ako sa v aplikácii prvýkrát zaregistrujete svojím emailom, môžete v Supabase SQL Editore spustiť:
```sql
UPDATE public.profiles 
SET role = 'trener' 
WHERE email = 'vas-email@klub.sk';
```

---

## 🔑 2. Získanie API Kľúčov zo Supabase

V Supabase Dashboarde vášho projektu:
1. Prejdite do **Project Settings** (ozubené koliesko vľavo dole) -> **API**.
2. Skopírujte tieto dve hodnoty:
   - **Project URL** (napr. `https://xyzcompany.supabase.co`) -> `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys -> `anon` / `public`** (dlhý JWT reťazec začínajúci na `eyJhbGci...`) -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ☁️ 3. Nasadenie na Vercel (Odporúčané, zadarmo)

Vercel poskytuje okamžitý bezplatný hosting pre Next.js s automatickou subdoménou `tvoj-projekt.vercel.app` a automatickým SSL certifikátom.

### Možnosť A: Cez GitHub (Najjednoduchšie)
1. Nahrajte tento priečinok na váš GitHub (napr. nový repozitár `sport-team-attendance`).
2. Choďte na [vercel.com](https://vercel.com) a prihláste sa cez GitHub.
3. Kliknite na **Add New...** -> **Project**.
4. Zvoľte váš repozitár a kliknite na **Import**.
5. V sekcii **Environment Variables** pridajte dve premenné:
   - `NEXT_PUBLIC_SUPABASE_URL` = Vaša Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Váš Supabase Anon Key
6. Kliknite na **Deploy**.
7. O 60 sekúnd je aplikácia live na vygenerovanej adrese `https://...vercel.app`!

### Možnosť B: Priamo cez Vercel CLI (bez GitHubu)
Ak máte nainštalovaný Node.js, v termináli tohto projektu spustite:
```bash
npx vercel
```
Postupujte podľa inštrukcií na obrazovke a pri výzve zadajte Environment Variables.

---

## 🌐 4. Alternatívne nasadenie na Netlify

V projekte je pripravený aj konfiguračný súbor [`netlify.toml`](file:///c:/Users/hroba/Downloads/zmazat/netlify.toml).

1. V [netlify.com](https://netlify.com) kliknite na **Add new site** -> **Import an existing project**.
2. Vyberte váš repozitár.
3. V **Site settings > Environment variables** zadajte:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Kliknite na **Deploy site**.
5. Aplikácia bude dostupná na subdoméne `https://vas-nazov.netlify.app`.

---

## 📲 5. Inštalácia PWA do Telefónu

### Na iPhone (iOS - Safari):
1. Otvorte webovú adresu aplikácie v prehliadači **Safari**.
2. Klepnite na ikonu **Zdieľať** (štvorec so šípkou hore uprostred spodnej lišty).
3. Posuňte ponuku a vyberte **Pridať na plochu** (Add to Home Screen).
4. Potvrďte názov a kliknite na **Pridať**. Ikona aplikácie sa objaví na ploche.

### Na Android (Google Chrome):
1. Otvorte adresu v prehliadači **Chrome**.
2. V dolnej časti obrazovky sa automaticky zobrazí banner **„Inštalovať na plochu“**, alebo kliknite na tri bodky vpravo hore a zvoľte **„Inštalovať aplikáciu“**.
3. Aplikácia sa nainštaluje ako samostatné WebAPK bez adresného riadku prehliadača.

---

## 🧪 6. Demo Režim (Okamžité testovanie bez DB)

Aplikácia obsahuje vstavaný **inteligentný Demo režim**. Ak ešte nemáte zadané Supabase kľúče, aplikácia automaticky nabehne s realistickými údajmi (hráči, tréningy, dôvody neúčasti) a umožňuje vám okamžite vyskúšať:
- Prepínanie pohľadu medzi **Trénerom** a **Hráčom** priamo v hlavičke alebo v profile.
- Plánovanie nového tréningu a úpravu stavov.
- Klikanie na dochádzku (Prídem, Neprídem s dôvodom, Možno).
- Zdieľanie tréningu do formátu pre WhatsApp.
