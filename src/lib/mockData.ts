import { Profile, Training, Attendance, Announcement } from './types';

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'user-coach-1',
    email: 'trener@sportklub.sk',
    full_name: 'Marek Hroššo (Hlavný tréner)',
    role: 'trener',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user-player-1',
    email: 'peter.novak@gmail.com',
    full_name: 'Peter Novák',
    role: 'clen',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'user-player-2',
    email: 'tomas.kovac@gmail.com',
    full_name: 'Tomáš Kováč',
    role: 'clen',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'user-player-3',
    email: 'michal.horvath@azet.sk',
    full_name: 'Michal Horváth',
    role: 'clen',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'user-player-4',
    email: 'juraj.kucera@post.sk',
    full_name: 'Juraj Kučera',
    role: 'clen',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'user-player-5',
    email: 'jakub.balaz@centrum.sk',
    full_name: 'Jakub Baláž',
    role: 'clen',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'user-player-6',
    email: 'martin.varga@gmail.com',
    full_name: 'Martin Varga',
    role: 'clen',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'user-player-7',
    email: 'samuel.toth@gmail.com',
    full_name: 'Samuel Tóth',
    role: 'clen',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'user-player-8',
    email: 'andrej.sykora@gmail.com',
    full_name: 'Andrej Sýkora',
    role: 'clen',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// Dátumy: zajtra, o 3 dni, o 6 dní, včera
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
tomorrow.setHours(18, 0, 0, 0);

const inThreeDays = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
inThreeDays.setHours(19, 30, 0, 0);

const inSixDays = new Date(now.getTime() + 6 * 24 * 3600 * 1000);
inSixDays.setHours(17, 30, 0, 0);

const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
yesterday.setHours(18, 30, 0, 0);

export const MOCK_TRAININGS: Training[] = [
  {
    id: 'tr-1',
    title: 'Kondičný & Herný tréning',
    date_time: tomorrow.toISOString(),
    location: 'Mestská športová hala, Palackého 12',
    notes: 'Vziať si sálovú obuv (biela podrážka) a fľašu s vodou. Začíname presne o 18:00 rozcvičkou!',
    status: 'scheduled',
    created_by: 'user-coach-1',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'tr-2',
    title: 'Predzápasová taktika a štandardky',
    date_time: inThreeDays.toISOString(),
    location: 'Hlavný futbalový štadión - tréningové ihrisko',
    notes: 'Príprava na nedeľňajší dôležitý ligový zápas. Účasť je povinná pre všetkých nominovaných.',
    status: 'scheduled',
    created_by: 'user-coach-1',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'tr-3',
    title: 'Regeneračný tréning a strečing',
    date_time: inSixDays.toISOString(),
    location: 'Posilňovňa & Wellness Centrum Olimpia',
    notes: 'Tréning bol zrušený z dôvodu neplánovanej údržby wellness centra.',
    status: 'cancelled',
    created_by: 'user-coach-1',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'tr-4',
    title: 'Silový tréning a výbušnosť',
    date_time: yesterday.toISOString(),
    location: 'Mestská športová hala',
    notes: 'Minulý tréning zameraný na zrýchlenie a stabilitu.',
    status: 'scheduled',
    created_by: 'user-coach-1',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export const MOCK_ATTENDANCES: Attendance[] = [
  // Pre tréning 1
  {
    id: 'att-1-1',
    training_id: 'tr-1',
    user_id: 'user-player-1',
    status: 'yes',
    reason: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'att-1-2',
    training_id: 'tr-1',
    user_id: 'user-player-2',
    status: 'yes',
    reason: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'att-1-3',
    training_id: 'tr-1',
    user_id: 'user-player-3',
    status: 'no',
    reason: 'Pracovná zmena do 20:00',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'att-1-4',
    training_id: 'tr-1',
    user_id: 'user-player-4',
    status: 'maybe',
    reason: 'Mierne natiahnutý sval, uvidím ako sa budem cítiť poobede',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'att-1-5',
    training_id: 'tr-1',
    user_id: 'user-player-5',
    status: 'yes',
    reason: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'att-1-6',
    training_id: 'tr-1',
    user_id: 'user-player-6',
    status: 'yes',
    reason: null,
    updated_at: new Date().toISOString(),
  },

  // Pre tréning 2
  {
    id: 'att-2-1',
    training_id: 'tr-2',
    user_id: 'user-player-1',
    status: 'yes',
    reason: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'att-2-2',
    training_id: 'tr-2',
    user_id: 'user-player-2',
    status: 'no',
    reason: 'Rodinná oslava mimo mesta',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'att-2-3',
    training_id: 'tr-2',
    user_id: 'user-player-5',
    status: 'yes',
    reason: null,
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: '🔔 Zmena miesta utorkového tréningu',
    content: 'Pozor všetci, v utorok trénujeme v Mestskej hale namiesto vonkajšieho ihriska kvôli predpovedi silného dažďa. Čas ostáva nezmenený o 18:00.',
    created_by: 'user-coach-1',
    author_name: 'Marek Hroššo (Tréner)',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ann-2',
    title: '👕 Nové klubové dresy na novú sezónu',
    content: 'Prišli nám nové klubové dresy a teplákové súpravy. Kto ešte nenahlásil svoju veľkosť trénerovi, spravte tak do piatku osobne alebo správou.',
    created_by: 'user-coach-1',
    author_name: 'Marek Hroššo (Tréner)',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ann-3',
    title: '⚠️ Zrušený regeneračný tréning budúci týždeň',
    content: 'Z dôvodu plánovanej odstávky vody v posilňovni je regeneračný tréning zrušený. Nahradíme ho individuálnym výbehom.',
    created_by: 'user-coach-1',
    author_name: 'Marek Hroššo (Tréner)',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];
