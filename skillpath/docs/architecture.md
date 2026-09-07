# Arhitectura

## Imaginea de ansamblu

SkillPath este o **singură aplicație Next.js**, nu un frontend plus un backend separat. Nu există server Express sau Nest, nu există rute `/api`. Logica de server trăiește în Server Actions din `backend/`, apelate direct din componentele server.

```
┌────────────────────────────────────────────────────────────┐
│  Browser                                                   │
│  Componente client (frontend/) — interacțiune, formulare   │
└───────────────┬────────────────────────────────────────────┘
                │  apel de Server Action (RPC, tipizat)
                ▼
┌────────────────────────────────────────────────────────────┐
│  Server Next.js                                            │
│                                                            │
│  proxy.ts ──────── reîmprospătează sesiunea la fiecare req │
│                                                            │
│  app/            rute; încarcă date, pasează props         │
│    (admin)/      protejat de layout.tsx (verificare rol)   │
│    (user)/       protejat de sesiune                       │
│                                                            │
│  backend/        "use server" — singurul strat care        │
│                  atinge baza de date                       │
│    ai/client.ts  fără "use server": ține cheia API         │
└───────────────┬───────────────────────────┬────────────────┘
                │                           │
                ▼                           ▼
        ┌───────────────┐         ┌──────────────────────┐
        │   Supabase    │         │  Endpoint AI         │
        │ Postgres+Auth │         │ compatibil OpenAI    │
        └───────────────┘         └──────────────────────┘
```

## Traseul unui request

Exemplu — un student deschide dashboard-ul:

1. **`proxy.ts`** interceptează requestul și apelează `supabase.auth.getUser()`. Efectul secundar contează: reîmprospătează token-ul și rescrie cookie-urile. Fără el, sesiunea expiră și utilizatorul e deconectat.
2. **`app/(user)/userDashboard/page.tsx`** — Server Component. Apelează `getDashboardData()`.
3. **`backend/user/getDashboardData.ts`** construiește un client Supabase per request (`helper/supabase/server.ts`), citește datele și calculează competențe, istoric de scor, categorii slabe și resurse recomandate.
4. Rezultatul ajunge ca props în **`frontend/user/dashboard/UserDashboardUI.tsx`**. Ce are nevoie de interactivitate e marcat `"use client"`; restul rămâne server-rendered.

Nu se serializează niciodată clientul Supabase către browser — doar datele deja calculate.

## Autentificare și roluri

- **Sesiune:** Supabase Auth pe cookie-uri, prin `@supabase/ssr`. Clientul de server (`helper/supabase/server.ts`) e construit *per request* din cookie-urile requestului. Un client la nivel de modul ar fi partajat între vizitatori — de aceea nu există niciunul.
- **Rol:** coloana `role` din tabela `users` (`user` sau `admin`).
- **Redirecționare la login:** `backend/auth/loginUser.ts` citește rolul și trimite spre `/adminDashboard` sau `/userDashboard`.
- **Protecția rutelor:** `app/(admin)/layout.tsx` verifică rolul o singură dată, pentru tot grupul. Orice pagină nouă de admin e protejată automat prin plasarea în grupul `(admin)`.

Grupurile de rute `(admin)` și `(user)` nu apar în URL — sunt doar o graniță de layout, deci și de autorizare.

## Motorul de evaluare

Două fluxuri distincte, ușor de confundat:

### Testul de calibrare (o singură dată, la onboarding)
`backend/user/assessments/initial/`

30 de întrebări, **10 pentru fiecare dintre cele 3 niveluri de dificultate**. Dificultatea vine de la **categorie**, nu de la întrebare. Selecția rotește categoriile printr-un cursor persistat pe durata procesului, ca doi studenți consecutivi să nu primească aceleași întrebări, și exclude întrebările la care utilizatorul a răspuns deja corect vreodată.

Rezultatul e un vector de forma `[8, 6, 4]` — câte corecte pe fiecare nivel. Nivelul se deduce în `inferLevelFromInitialScores`: peste 6 corecte la nivelul 1 → Intermediate; peste 6 și la nivelul 2 → Advanced.

### Testele pe categorie (oricâte)
`backend/user/generateAssessment.ts`

Studentul alege o categorie, primește până la 10 întrebări active amestecate. Se creează un rând în `assessments` plus câte un rând gol în `assessment_answers` per întrebare — de aceea progresul supraviețuiește unui refresh: răspunsurile se scriu pe rândurile existente, prin `saveProgressAssessment`.

### Scoring și nivel
`backend/user/submitAssessment.ts` corectează **pe server**, comparând `selected_option_id` cu `correct_answer`. Clientul nu primește niciodată răspunsul corect înainte de trimitere.

`backend/user/evaluateUserLevel.ts` stabilește nivelul pe **lățime, nu pe repetiție**: contează testele trecute (peste `PASS_SCORE = 75`) în **categorii distincte**. Zece teste trecute în aceeași categorie nu te fac Advanced. Nivelul nu scade niciodată — un rezultat slab ulterior nu retrogradează utilizatorul.

## Recomandările de învățare

**Sunt bazate pe reguli, nu pe AI.** În `backend/user/getDashboardData.ts`: categoriile sub 60% sunt marcate slabe, iar pentru ele se aduc resurse din `learning_resources`. Deterministic și explicabil — un student poate vedea exact de ce i-a apărut o resursă.

Singurul loc unde intervine AI-ul este generatorul de întrebări pentru admin: [ai-features.md](ai-features.md).

## Decizii și compromisuri

### 1. Server Actions în loc de un API REST separat
**Ales pentru că** elimină un strat întreg — fără handlere de rute, fără tipuri DTO duplicate, fără client HTTP. Tipurile se propagă direct din acțiune în componentă.
**Costul:** logica e legată de Next.js. O aplicație mobilă ar avea nevoie de un strat HTTP construit de la zero. Am acceptat: nu există alt client planificat.

### 2. `supabase-js` direct, fără ORM
**Ales pentru că** ne-a scutit de configurarea unui ORM și de menținerea unui strat de modele într-un proiect de șase săptămâni.
**Costul, asumat explicit:** **schema nu e versionată în repo.** Nu există migrări; structura trăiește în Supabase Studio. Un coleg nou nu poate reconstrui baza de date din cod. Compensăm prin [database-schema.md](database-schema.md), menținut manual — cea mai mare datorie tehnică a proiectului. Într-un proiect cu durată mai lungă am fi ales Drizzle sau migrări SQL.

### 3. Endpoint AI compatibil OpenAI, nu SDK-ul unui furnizor
**Ales pentru că** `AI_BASE_URL` + `AI_MODEL` schimbă providerul fără o linie de cod. Rulăm pe Gemini Flash; OpenAI, Groq, OpenRouter sau un Ollama local ar merge la fel.
**Costul:** nu folosim funcții specifice unui furnizor. Nu ne-au lipsit.

### 4. Corectare exclusiv pe server
**Ales pentru că** orice altceva înseamnă că răspunsurile corecte ajung în browser și pot fi citite din DevTools.
**Costul:** nu se poate da feedback instantaneu per întrebare fără un request suplimentar. Am preferat integritatea testului.

### 5. Test de calibrare separat de testele obișnuite
**Ales pentru că** onboarding-ul are alte reguli: 30 de întrebări fixe, dificultate din categorie, un vector de scoruri pe niveluri.
**Costul:** două căi de cod pentru „dă un test”, cu risc de divergență. Distincția se face prin numărarea răspunsurilor (`isInitialAssessment`), ceea ce e un semnal fragil — un flag pe `assessments` ar fi fost mai curat. Îl notăm ca datorie tehnică.

## Limitări cunoscute

- **Fără migrări de bază de date.** Vezi compromisul 2.
- **Politicile RLS nu sunt versionate** în repo; trăiesc în Supabase.
- **Fără CI.** Testele se rulează local, înainte de PR.
- **Cursorul de categorii** din testul de calibrare e ținut în memoria procesului. La mai multe instanțe, fiecare are cursorul ei — acceptabil, pentru că efectul lui e doar varietatea, nu corectitudinea.
- **`isInitialAssessment` identifică testul de calibrare după numărul de răspunsuri (30).** Un test obișnuit cu exact 30 de întrebări ar fi confundat cu el. În practică testele pe categorie au maximum 10.
