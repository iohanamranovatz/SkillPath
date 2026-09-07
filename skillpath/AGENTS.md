# Convenții de cod — SkillPath

Ghid pentru oricine adaugă cod în acest repo, om sau agent AI. Pentru ce face aplicația și cum se pornește, vezi [README.md](README.md).

Toate căile sunt relative la `skillpath/`.

---

## Unde stă fiecare lucru

| Folder | Conține | Nu conține |
|---|---|---|
| `app/` | Rute App Router: `page.tsx`, `layout.tsx`, `loading.tsx` | Logică de business, componente reutilizabile |
| `backend/` | Server Actions — tot ce atinge Supabase | JSX, hook-uri React |
| `frontend/` | Componente React, grupate pe rol (`admin/`, `user/`, `components/`) | Apeluri directe la Supabase |
| `helper/supabase/` | Construirea clienților Supabase | Orice altceva |
| `tests/` | Vitest: unitare, componente, integrare | Teste care lovesc Supabase-ul real |
| `e2e/` | Playwright — rulează pe aplicația reală | Mock-uri |
| `docs/` | Documentația proiectului | Cod |

O rută din `app/` ar trebui să fie subțire: încarcă datele printr-o acțiune din `backend/` și le pasează unei componente din `frontend/`.

---

## Reguli

### 1. Datele se aduc pe server
Componentele client nu vorbesc cu Supabase. Ruta (Server Component) apelează o acțiune din `backend/` și transmite rezultatul ca props. Clientul de browser (`helper/supabase/client.ts`) e rezervat pentru autentificare și pentru interacțiuni pornite de utilizator.

### 2. `"use server"` doar acolo unde trebuie
Directiva transformă fiecare export într-un endpoint apelabil din browser. Nu o pune într-un modul care conține secrete.

`backend/ai/client.ts` este **intenționat** fără `"use server"` — ține cheia AI. Se importă doar din alte module de server. Dacă adaugi directiva acolo, expui cheia.

### 3. Validează pe server orice vine de la client
Payload-urile din browser pot fi falsificate. Chiar dacă interfața a validat deja, revalidează în acțiune înainte de scriere. Model de urmat: `saveQuestionDrafts` din `backend/admin/actions/generateQuestions.ts`, care reverifică forma fiecărei întrebări deși aceeași verificare a rulat și la generare.

### 4. Corectitudinea răspunsurilor nu iese niciodată din server înainte de trimitere
Întrebările ajung la client fără `correct_answer`. Corectarea se face în `backend/user/submitAssessment.ts`. Răspunsurile corecte se dezvăluie abia în pagina de rezultate.

### 5. Rutele de admin se protejează în layout
`app/(admin)/layout.tsx` verifică rolul și redirecționează. O pagină nouă de admin trebuie pusă în grupul `(admin)`, nu protejată separat.

### 6. Forma răspunsului unei acțiuni
Acțiunile returnează un obiect, nu aruncă excepții către componente:

```ts
{ success: true, data: ... }
{ success: false, error: "mesaj pentru utilizator" }
```

Mesajele de eroare sunt pentru ochii utilizatorului. Detaliile de la furnizori externi se scriu în `console.error`, nu se returnează — pot conține chei sau date interne.

### 7. Invalidează cache-ul după scriere
După un `insert`/`update`/`delete`, apelează `revalidatePath("/ruta-afectată")`, altfel utilizatorul vede date vechi.

---

## Stil

- **TypeScript strict.** `any` doar la marginea dinspre Supabase, unde tipurile nu sunt generate.
- **Indentare de 4 spații**, ghilimele duble.
- **Import-uri prin alias**: `@/backend/...`, `@/frontend/...`. Fără `../../..`.
- **Comentariile explică *de ce*, nu *ce*.** Un comentariu care repetă codul se șterge.
- **Codul și comentariile noi se scriu în engleză.** (Repo-ul conține și comentarii mai vechi în română; se traduc pe măsură ce fișierele sunt atinse.)
- **Tailwind pentru stilizare.** Fără fișiere CSS noi; `globals.css` ține doar variabilele de temă.

---

## Testare

Orice acțiune nouă din `backend/` vine la pachet cu teste. Pragurile din `vitest.config.ts` sunt impuse la fiecare rulare de coverage — un PR care le coboară nu se merge.

### Mock-ul de Supabase
Folosește `tests/helpers/supabaseMock.ts`. `mockFrom` mapează fiecare tabelă la un rezultat; un array devine o coadă consumată în ordinea apelurilor:

```ts
import { mockFrom } from "../helpers/supabaseMock";

const queries = mockFrom(supabase.from, {
    categories: { data: { id: 7, name: "Frontend" }, error: null },
    questions: [
        { data: [], error: null },              // primul apel
        { data: [{ id: 1 }], error: null },     // al doilea
    ],
});

expect(queries.questions[0].insert).toHaveBeenCalledWith(/* ... */);
```

Lanțul de metode are orice lungime și orice ordine — fiecare metodă e un spy și returnează același obiect.

### Ce se testează
- **Acțiuni de server** — calea fericită, fiecare cale de eroare, fiecare ramură de validare.
- **Componente** — ce vede utilizatorul, nu starea internă. Testing Library, interogări după rol și text.
- **Integrare** (`tests/integration/`) — rută + acțiune + componentă, cu Supabase mockuit.
- **E2E** (`e2e/`) — fluxuri complete pe Supabase real. Nu se rulează în CI fără conturi de test.

### Înainte de a deschide un PR

```bash
npm run lint
npx tsc --noEmit
npm run test:coverage
```

---

## Baza de date

Schema e administrată în Supabase Studio, nu prin migrări în repo. Dacă modifici structura, actualizează [docs/database-schema.md](docs/database-schema.md) în același PR — altfel documentul devine singura sursă de adevăr și e greșit.
