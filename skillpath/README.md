# SkillPath

Aplicație web pentru **evaluarea competențelor software** și **recomandarea de trasee de învățare**.

Un student dă un test de calibrare, primește un nivel estimat (Beginner / Intermediate / Advanced), vede scorul defalcat pe categorii și primește resurse de învățare pentru zonele slabe. Un admin administrează categoriile, banca de întrebări și urmărește progresul întregii grupe dintr-un dashboard agregat.

Proiect realizat în cadrul **Concentrix Practice Program 2026 — Fazele 3-5**.

| | |
|---|---|
| **Echipă** | Diana Persa · Brigi Mranovatz · Octavian Istrate |
| **Repo** | `iohanamranovatz/SkillPath` |
| **Stack** | Next.js 16 (App Router) · React 19 · TypeScript · Supabase · Tailwind CSS v4 |
| **Teste** | 487 teste Vitest + 4 suite Playwright · coverage 89% statements |

---

## Cuprins

- [Funcționalități](#funcționalități)
- [Stack tehnologic](#stack-tehnologic)
- [Pornire rapidă](#pornire-rapidă)
- [Variabile de mediu](#variabile-de-mediu)
- [Scripturi npm](#scripturi-npm)
- [Testare](#testare)
- [Structura proiectului](#structura-proiectului)
- [Documentație](#documentație)

---

## Funcționalități

### Student
- **Test de calibrare** la înregistrare — 30 de întrebări, 10 per nivel de dificultate, care stabilesc nivelul estimat inițial.
- **Teste pe categorie** — alegi o categorie, primești până la 10 întrebări active, amestecate.
- **Progres salvat automat** — poți închide pagina în mijlocul testului și relua de unde ai rămas.
- **Rezultate detaliate** — scor total, scor per categorie, grafic radar al competențelor și recapitularea fiecărui răspuns (răspunsul corect se dezvăluie abia după trimitere).
- **Plan de învățare** — resurse recomandate automat pentru categoriile sub 60%.
- **Profil** — nivel estimat, arii de interes, obiective de învățare (maximum 5) și istoricul testelor.

### Admin
- **Dashboard agregat** — utilizatori, teste finalizate, activitate pe ultimele 7 zile, top utilizatori, categoriile cele mai slabe la nivel de grupă.
- **Catalog de categorii** — categorii, tag-uri și resurse de învățare asociate.
- **Bancă de întrebări** — CRUD complet, cu căutare, filtrare pe categorie/dificultate/status și activare-dezactivare.
- **Generator AI de întrebări** — vezi [docs/ai-features.md](docs/ai-features.md).
- **Administrare utilizatori** — listă, schimbare de rol, inspectarea testelor și a răspunsurilor fiecărui student.

---

## Stack tehnologic

| Strat | Tehnologie | De ce |
|---|---|---|
| Framework | **Next.js 16**, App Router | Server Components + Server Actions elimină un strat de API separat |
| Limbaj | **TypeScript** (strict) | Tipuri partajate între server și client, fără duplicare |
| Backend | **Server Actions** (`backend/`) | Logica de server e apelată direct din componente, tipizată cap-coadă |
| Bază de date | **Supabase** (PostgreSQL) | Postgres găzduit + autentificare inclusă |
| Autentificare | **Supabase Auth** + `@supabase/ssr` | Sesiune pe cookie-uri, reîmprospătată în `proxy.ts` |
| UI | **Tailwind CSS v4**, `@base-ui/react`, `lucide-react` | Stilizare rapidă, componente accesibile |
| Grafice | **Recharts** | Radar de competențe și evoluția scorului |
| AI | Orice endpoint compatibil **OpenAI** | Providerul se schimbă din `.env.local`, fără modificări de cod |
| Teste | **Vitest** + Testing Library, **Playwright** | Unitare/integrare rapide + E2E pe aplicația reală |

> **Notă:** în Next.js 16 convenția `middleware.ts` a fost redenumită `proxy.ts`. Fișierul din rădăcină nu e un proxy de rețea — reîmprospătează token-ul Supabase la fiecare request.

---

## Pornire rapidă

### Prerechizite
- **Node.js 20+** și npm
- Un **proiect Supabase** (planul gratuit e suficient) cu schema din [docs/database-schema.md](docs/database-schema.md)
- *Opțional:* o cheie pentru un endpoint AI compatibil OpenAI — fără ea aplicația merge integral, doar generatorul de întrebări se dezactivează elegant

### Pași

```bash
git clone https://github.com/iohanamranovatz/SkillPath.git
cd SkillPath/skillpath
npm install
# creează skillpath/.env.local cu variabilele din tabelul de mai jos
npm run dev
```

Aplicația pornește pe <http://localhost:3000>.

### Primul cont

1. Creează-ți cont din `/signup` și confirmă adresa de email (Supabase trimite un link).
2. La prima autentificare ești dus prin **testul de calibrare** de 30 de întrebări.
3. Pentru un cont de **admin**, schimbă manual `role` în `admin` în tabela `users` din Supabase Studio. Ulterior, orice admin poate promova alți utilizatori din interfață.

> Aplicația are nevoie de întrebări active în baza de date ca să genereze teste. Dacă tabela `questions` e goală, adaugă-le din panoul de admin sau folosește generatorul AI.

---

## Variabile de mediu

Toate se pun în `skillpath/.env.local` (fișierul e în `.gitignore`).

| Variabilă | Obligatorie | Descriere |
|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL-ul proiectului Supabase (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Cheia publică `anon`. Ajunge în browser — protecția reală o dau politicile RLS |
| `NEXT_PUBLIC_SITE_URL` | ➖ | Baza pentru linkul de confirmare a emailului. Implicit `http://localhost:3000` |
| `AI_BASE_URL` | ➖ | Endpoint compatibil OpenAI, **fără** `/chat/completions` la final |
| `AI_API_KEY` | ➖ | Cheia providerului AI. **Nu are prefixul `NEXT_PUBLIC_`** — rămâne pe server |
| `AI_MODEL` | ➖ | Numele modelului. Implicit `gemini-2.5-flash` |

Pentru testele E2E mai e nevoie de `skillpath/e2e/.env.test.local` — detalii în [e2e/README.md](e2e/README.md).

---

## Scripturi npm

| Comandă | Ce face |
|---|---|
| `npm run dev` | Server de dezvoltare pe `:3000` |
| `npm run build` | Build de producție |
| `npm start` | Rulează build-ul de producție |
| `npm run lint` | ESLint |
| `npm test` | Vitest în mod watch |
| `npm run test:run` | Vitest o singură dată |
| `npm run test:coverage` | Vitest cu raport de acoperire (impune pragurile) |
| `npm run e2e` | Toate suitele Playwright |
| `npm run e2e:public` | Doar suitele care nu au nevoie de autentificare |
| `npm run e2e:ui` | Playwright în mod interactiv |
| `npm run e2e:report` | Deschide ultimul raport Playwright |

---

## Testare

```bash
npm run test:coverage
```

Stare curentă:

| Metrică | Acoperire | Prag configurat |
|---|---:|---:|
| Statements | **89.13%** | 75% |
| Branches | **79.36%** | 70% |
| Functions | **87.85%** | 75% |
| Lines | **89.98%** | 75% |

**487 de teste** în 25 de fișiere, plus 4 suite Playwright. Detalii despre ce e mockuit și cum se rulează fiecare nivel: [docs/testing.md](docs/testing.md).

---

## Structura proiectului

```
skillpath/
├── app/                  # rute Next.js (App Router)
│   ├── (admin)/          # rute de admin, protejate în layout.tsx
│   ├── (user)/           # rute de student
│   ├── login/ signup/    # rute publice
│   └── page.tsx          # landing page
├── backend/              # logica de server ("use server")
│   ├── ai/               # client AI, agnostic de provider
│   ├── admin/            # acțiuni de admin
│   ├── auth/             # login, signup, logout
│   ├── user/             # teste, scoring, dashboard, profil
│   └── categories.ts     # categorii, tag-uri, resurse
├── frontend/             # componente React (fără rute)
├── helper/supabase/      # client Supabase pentru browser și pentru server
├── tests/                # Vitest — unitare, componente, integrare
├── e2e/                  # Playwright
├── docs/                 # documentația proiectului
└── proxy.ts              # reîmprospătarea sesiunii (fostul middleware.ts)
```

Convențiile de cod și regulile pentru contribuții sunt în [AGENTS.md](AGENTS.md).

---

## Documentație

| Document | Conținut |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Arhitectura, fluxul unui request, deciziile și compromisurile asumate |
| [docs/database-schema.md](docs/database-schema.md) | Cele 9 tabele, coloane și relații |
| [docs/acceptance-criteria.md](docs/acceptance-criteria.md) | Criterii de acceptanță per funcționalitate, cu fișierele și testele care le acoperă |
| [docs/testing.md](docs/testing.md) | Strategia de testare și cum se rulează fiecare nivel |
| [docs/ai-features.md](docs/ai-features.md) | Generatorul AI de întrebări, cap-coadă |
| [AGENTS.md](AGENTS.md) | Convenții de cod pentru contribuitori (oameni sau agenți AI) |
| [e2e/README.md](e2e/README.md) | Configurarea și rularea testelor end-to-end |
