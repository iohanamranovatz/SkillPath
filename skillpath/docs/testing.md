# Strategia de testare

Trei niveluri, fiecare cu o treabă clară:

| Nivel | Unelte | Fișiere | Ce verifică | Bază de date |
|---|---|---|---|---|
| **Unitare / componente** | Vitest + Testing Library | `tests/backend/`, `tests/frontend/` | Logica unei acțiuni; ce vede utilizatorul într-o componentă | Mockuită |
| **Integrare** | Vitest | `tests/integration/` | Rută + acțiune + componentă, împreună | Mockuită |
| **End-to-end** | Playwright | `e2e/` | Fluxuri complete, pe aplicația reală | Supabase real |

**487 de teste** în 25 de fișiere Vitest, plus 4 suite Playwright.

---

## Rulare

```bash
npm test               # Vitest, mod watch
npm run test:run       # o singură rulare
npm run test:coverage  # cu raport de acoperire; impune pragurile
```

Un singur fișier:

```bash
npx vitest run tests/backend/generateQuestions.test.ts
```

---

## Acoperire

Pragurile sunt configurate în `vitest.config.ts` și verificate la fiecare rulare cu `--coverage`. Sub prag, comanda iese cu cod de eroare.

| Metrică | Actual | Prag |
|---|---:|---:|
| Statements | **89.13%** | 75% |
| Branches | **79.36%** | 70% |
| Functions | **87.85%** | 75% |
| Lines | **89.98%** | 75% |

Raportul HTML se generează în `coverage/index.html`.

Lista `include` din configurație acoperă tot `app/`, `backend/` și `frontend/`, **inclusiv fișierele pe care niciun test nu le importă**. Fără asta, codul netestat ar dispărea din raport și procentul ar fi o minciună confortabilă. Sunt excluse doar `mock-data.ts` și `types.ts` — nu conțin logică.

---

## Testele de backend

Un fișier per zonă de acțiuni. Fiecare cale de eroare are testul ei — nu doar calea fericită.

| Fișier | Acoperă |
|---|---|
| `aiClient.test.ts` | Clientul AI: configurație, parsare, timeout, erori |
| `generateQuestions.test.ts` | Generatorul AI: prompt, validare, duplicate, salvare |
| `initialAssessment.test.ts` | Testul de calibrare: selecție, transe, deducerea nivelului |
| `assessment.test.ts` | Generarea și trimiterea testelor pe categorie |
| `evaluateUserLevel.test.ts` | Motorul de nivel: prag de trecere, lățime, fără retrogradare |
| `questions.test.ts`, `categories.test.ts`, `admin.test.ts` | CRUD de admin |
| `auth.test.ts`, `loginUser.test.ts` | Autentificare, roluri, redirecționare |
| `profile.test.ts` | Profil, obiective, interese |
| `getDashboardData.test.ts`, `getAdminDashboardData.test.ts` | Agregări de dashboard |
| `resultsAnalytics.test.ts`, `userAnalytics.test.ts` | Calculele din pagina de rezultate |

### Mock-ul de Supabase

`tests/helpers/supabaseMock.ts`. Un `Proxy` peste o promisiune: orice metodă apelată (`.select`, `.eq`, `.in`, `.order`, `.single`, `.range` …) întoarce același obiect, deci lanțul poate avea orice lungime și orice ordine. La `await`, se rezolvă cu rezultatul configurat. Fiecare metodă e un spy.

```ts
const queries = mockFrom(supabase.from, {
    categories: { data: { id: 7, name: "Frontend" }, error: null },
    questions: [
        { count: 5, error: null },              // primul apel
        { data: [{ id: 1 }], error: null },     // al doilea
    ],
});

expect(queries.questions[0].not).toHaveBeenCalledWith("id", "in", "(42)");
```

O valoare simplă răspunde la fiecare apel pe acea tabelă; un array e o coadă consumată în ordine, iar ultimul element rămâne activ.

Un detaliu de reținut: proxy-ul creează spy-uri **la cerere**, deci `query.insert` există întotdeauna. Ca să verifici că nu s-a scris nimic, folosește `expect(query.insert).not.toHaveBeenCalled()` — nu `toBeUndefined()`.

### Mock-uri globale

`vitest.setup.ts` mockează `next/navigation` (router, `redirect`, `useSearchParams`) și pune un client Supabase inert peste `helper/supabase/*`. Fișierele care au nevoie de date concrete își pun propriul mock deasupra.

---

## Testele de componente

Testing Library, interogări după rol și text vizibil — nu după clase CSS sau stare internă. Un test trebuie să pice atunci când se strică experiența utilizatorului, nu când se redenumește o variabilă.

Acoperă formularele de autentificare, panourile de admin (categorii, întrebări, dashboard) și ecranele de student (dashboard, rezultate, profil, listă de teste).

---

## Testele de integrare

`tests/integration/` montează o rută împreună cu acțiunile ei, cu Supabase mockuit. `assessment-flow.test.ts` parcurge lanțul complet: generare → salvarea progresului → trimitere → scor.

---

## Testele end-to-end

Playwright, pe aplicația reală și pe un Supabase real. Detalii complete de configurare: [../e2e/README.md](../e2e/README.md).

```bash
npx playwright install chromium     # o singură dată
npm run e2e                         # toate suitele
npm run e2e:public                  # doar ce nu are nevoie de cont
npm run e2e:ui                      # mod interactiv
npm run e2e:report                  # ultimul raport
```

| Proiect | Fișier | Are nevoie de cont |
|---|---|---|
| `public` | `public.spec.ts` | nu |
| `user` | `user-dashboard.spec.ts`, `user-assessment.spec.ts` | student |
| `admin` | `admin-panel.spec.ts` | admin |

Conturile se configurează în `e2e/.env.test.local`. Suitele care au nevoie de autentificare **se auto-ignoră** dacă lipsesc credențialele, ca `npm run e2e` să nu pice pe o mașină neconfigurată.

Playwright pornește singur `npm run dev` și rulează cu `workers: 1` — testele ating aceleași date. La eșec salvează trace, screenshot și video.

> **Atenție:** suitele E2E scriu în baza de date reală (creează teste, salvează răspunsuri). Rulează-le pe un proiect Supabase de test, nu pe cel de demo, cu o zi înainte de prezentare.

---

## Înainte de un PR

```bash
npm run lint
npx tsc --noEmit
npm run test:coverage
```

Un PR care coboară acoperirea sub praguri nu se merge. Orice acțiune nouă din `backend/` vine cu testele ei.
