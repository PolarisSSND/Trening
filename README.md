# ⚽ Športový Tím - Správa Tréningov a Dochádzky (PWA)

Kompletná responzívna webová a mobilná aplikácia vo forme **PWA (Progressive Web App)** na plánovanie tréningov, evidenciu dochádzky členov a klubovú komunikáciu.

Aplikácia je pripravená na okamžité nasadenie na bezplatný hosting **Netlify** alebo **Vercel** s automaticky vygenerovanou subdoménou (napr. `tvoj-projekt.netlify.app`).

---

## 🚀 Hlavné Funkcie

### 👨‍💼 Pre Trénera (Správca / Admin):
- **Vytváranie a úprava tréningov:** Nastavenie dátumu, presného času, miesta konania (s priamym preklikom na Google Maps) a podrobných inštrukcií/poznámok pre členov.
- **Stav tréningu:** Možnosť prepínať medzi stavom **„Koná sa“** a **„Zrušený“** s okamžitým vizuálnym upozornením tímu.
- **Kompletný prehľad prihlásených členov:** Prehľadný zoznam všetkých členov prihlásených na daný tréning.
- **Manuálna správa dochádzky:** Tréner môže kedykoľvek manuálne prihlásiť alebo odhlásiť ktoréhokoľvek člena.
- **Zdieľanie s tímom:** Generovanie predformátovanej správy na **WhatsApp / SMS** na 1 kliknutie.
- **Správa členov:** Prehľad dochádzkovej štatistiky členov a možnosť meniť roly (povýšiť na trénera / zmeniť na člena).

### 🏃‍♂️ Pre Člena (Športovec / Používateľ):
- **Prehľad tréningov:** Prehľad nadchádzajúcich tréningov a história minulých tréningov.
- **Jediné prepínacie tlačidlo prihlásenia:**
  - Ak nie je prihlásený: **„Prihlásiť sa na tréning“**
  - Ak už je prihlásený: **„Odhlásiť sa z tréningu“**
- **Zoznam prihlásených členov:** Priamo pod tlačidlom vidí zoznam všetkých ostatných členov tímu, ktorí na tréning prídu.

### 📱 PWA & Mobilné funkcie:
- **Zjednodušená spodná navigačná lišta:** Presne 2 položky pre maximálnu prehľadnosť – **Tréningy** a **Profil**.
- **Inštalovateľná na plochu:** Plnohodnotná podpora PWA pre **iOS (iPhone/iPad - Safari)** a **Android (Chrome)**.
- **Opravený a plne funkčný Tmavý & Svetlý režim (Dark/Light mode):** Okamžité prepínanie s pamäťou v `localStorage`.
- **Offline podpora:** Service Worker zabezpečuje caching statických assetov a offline informačnú obrazovku.

---

## 🗄️ 1. Nastavenie Supabase Databázy (SQL Skripty)

V koreňovom adresári projektu sa nachádza súbor [`schema.sql`](file:///c:/Users/hroba/Downloads/zmazat/schema.sql).

### Postup aktivácie v Supabase:
1. Prihláste sa do [Supabase Dashboardu](https://supabase.com/dashboard).
2. Otvorte váš projekt.
3. V ľavom bočnom paneli kliknite na **SQL Editor**.
4. Kliknite na **New Query** (alebo **+**).
5. Skopírujte a vložte celý obsah súboru `schema.sql`.
6. Kliknite na zelené tlačidlo **Run** (Spustiť).

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

## 🌐 3. Nasadenie na Netlify (Zadarmo)

V projekte je pripravený konfiguračný súbor [`netlify.toml`](file:///c:/Users/hroba/Downloads/zmazat/netlify.toml).

1. V [app.netlify.com](https://app.netlify.com) kliknite na **Add new site** -> **Import an existing project**.
2. Vyberte váš repozitár **`PolarisSSND/Trening`**.
3. V sekcii **Environment variables** pridajte:
   - `NEXT_PUBLIC_SUPABASE_URL` = Vaša Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Váš Supabase Anon Key
4. Kliknite na **Deploy Trening**.
5. Aplikácia bude dostupná na subdoméne `https://vas-nazov.netlify.app`.

---

## 📲 4. Inštalácia PWA do Telefónu

### Na iPhone (iOS - Safari):
1. Otvorte adresu aplikácie v prehliadači **Safari**.
2. Klepnite na ikonu **Zdieľať** dole v strede.
3. Zvoľte možnosť **„Pridať na plochu“** (Add to Home Screen).

### Na Android (Google Chrome):
1. Otvorte adresu v prehliadači **Chrome**.
2. Klepnite na banner **„Inštalovať na plochu“** alebo v menu (3 bodky) zvoľte **„Inštalovať aplikáciu“**.
