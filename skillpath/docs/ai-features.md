# Funcționalități AI

SkillPath are **o singură funcționalitate AI**, deținută de **Brigi Mranovatz**: generatorul de întrebări pentru banca de întrebări a adminului.

Restul a ceea ce ar putea suna a AI — recomandările de învățare, estimarea nivelului — este **bazat pe reguli**, deterministic și explicabil. Nu îl prezentăm ca AI.

---

## Generatorul de întrebări

**Problema:** o bancă de întrebări utilă are nevoie de zeci de întrebări per categorie. Scrise manual, e ore de muncă. Scrise de un model fără verificare, ajungi cu întrebări duplicate, cu două răspunsuri corecte sau cu trei opțiuni.

**Soluția:** modelul propune, adminul dispune. Nimic nu ajunge în baza de date fără o decizie umană.

### Fluxul

```
Admin: categorie + dificultate + număr (1-10)
   │
   ├─► încarcă TOATE întrebările existente din categorie  ──► listă "avoid" în prompt
   │
   ├─► apel la model, răspuns forțat JSON
   │
   ├─► validare de formă      ──► ce nu trece e aruncat și numărat
   │
   ├─► detecție de duplicate  ──► marcate, NU aruncate
   │
   ▼
Draft-uri afișate adminului (nimic scris în baza de date)
   │
   ├─► acceptă / editează / respinge
   │
   ▼
saveQuestionDrafts ──► revalidare pe server ──► insert cu is_active = false
```

### Fișiere

| Fișier | Rol |
|---|---|
| `backend/ai/client.ts` | Client agnostic de provider peste orice endpoint compatibil OpenAI |
| `backend/admin/actions/generateQuestions.ts` | Prompt, validare, detecție de duplicate, salvare |
| `frontend/admin/Questions/ai-generator.tsx` | Interfața de review |
| `tests/backend/aiClient.test.ts` | 19 teste |
| `tests/backend/generateQuestions.test.ts` | 36 de teste |

---

## Clientul AI

`backend/ai/client.ts` expune o singură funcție:

```ts
askJSON<T>(system: string, user: string, options?): Promise<
    { ok: true; data: T } | { ok: false; error: string }
>
```

**Agnostic de provider.** Vorbește doar `POST /chat/completions`, deci orice endpoint compatibil OpenAI merge — Gemini, OpenAI, Groq, OpenRouter, Ollama local. Schimbarea providerului înseamnă trei variabile de mediu, zero linii de cod. Rulăm pe `gemini-2.5-flash`.

**Cheia nu poate ajunge la client.** Fișierul este intenționat **fără** `"use server"`. Directiva ar transforma fiecare export într-un endpoint apelabil din browser, iar modulul ține cheia API. Se importă doar din alte module de server. Comentariul din fișier explică asta, ca nimeni să nu „repare” lipsa directivei.

**Robustețe:**
- `response_format: { type: "json_object" }` cere JSON explicit.
- Când modelul răspunde totuși cu proză sau cu blocuri ```` ```json ````, `extractJson` decupează între prima `{` și ultima `}`.
- `AbortSignal.timeout` — implicit 20s, 45s la generare.
- `reasoning_effort` configurabil; implicit `none`, pentru că gândirea aproape dublează latența.
- Fără configurație, întoarce `"AI is not configured"`. Restul aplicației funcționează normal.

**Erorile providerului nu se scurg.** Un răspuns de eroare poate conține requestul ecou, inclusiv cheia. Body-ul se scrie în `console.error`; apelantul primește doar `"AI provider returned 401."` Există un test care verifică exact asta.

---

## Prompt-ul

Promptul de sistem impune regulile care contează:
- exact 4 opțiuni plauzibile, una singură corectă;
- `correctIndex` e indexul 0-based al opțiunii corecte;
- fără „toate variantele de mai sus” și fără întrebări-capcană;
- **fără repetarea întrebărilor din lista `avoid` — reformularea contează ca repetare**;
- dificultatea are înțeles fix: EASY = un fapt de bază, MEDIUM = aplicarea unui concept, HARD = un caz-limită sau un compromis;
- substanța se pune la începutul enunțului, pentru că lista de admin afișează primele caractere ca etichetă.

Mesajul de utilizator e JSON: numele și descrierea categoriei, dificultatea, numărul cerut și **lista completă a întrebărilor existente din categorie**. Nu un eșantion recent — un duplicat al unei întrebări vechi e tot un duplicat.

---

## Validarea

Ce iese dintr-un model e text, nu date. O întrebare e păstrată doar dacă:

- enunțul e nevid după `trim`;
- are **exact 4** opțiuni;
- nicio opțiune nu e goală;
- **toate 4 sunt distincte** (`new Set(options).size === 4`);
- `correctIndex` e **întreg**, între 0 și 3.

Ce nu trece e aruncat în tăcere, dar **numărat**: interfața spune adminului „2 întrebări au fost eliminate”. O eliminare invizibilă ar face să pară că modelul a returnat mai puțin decât i s-a cerut.

Dacă nu trece nimic, acțiunea întoarce eroare în loc de o listă goală.

---

## Detecția duplicatelor

Un model căruia i se cere „mai multe întrebări despre React” va reformula. Verificarea pe text exact nu prinde nimic.

**Algoritm — indicele Jaccard peste cuvintele de conținut:**

1. **Normalizare** — litere mici, se elimină punctuația, se colapsează spațiile. *„What is a VARIABLE, exactly?”* și *„what is a variable exactly”* devin identice.
2. **Eliminarea cuvintelor goale** — `what`, `is`, `the`, `which`, `following`, `used` … apar în aproape orice întrebare și ar umfla artificial scorul. Se elimină și cuvintele de o literă.
3. **Jaccard** = cuvinte comune / cuvinte distincte totale. `1` = formulare identică.
4. **Prag 0,6.**

Exemplu:

| Existentă | Candidată | Scor | Verdict |
|---|---|---|---|
| „What is a variable in programming?” | „What is a variable in programming exactly?” | 0,67 | duplicat |
| „What is a variable in programming?” | „Which HTTP status code indicates a permanent redirect?” | 0,00 | distinctă |
| „Which of the following is used to declare a constant?” | „Which of the following is used to iterate an array?” | < 0,6 | distinctă |

Ultimul rând e motivul pentru care există lista de cuvinte goale: cele două întrebări au șase cuvinte comune, dar niciunul nu poartă sens.

**Verificarea se face în ambele direcții:** față de baza de date **și** față de întrebările generate mai devreme în același lot. Un model poate să se repete pe sine în cadrul aceluiași răspuns.

**Duplicatele nu se aruncă — se marchează.** Draft-ul ajunge la admin cu `duplicateOf` (enunțul întrebării similare) și `similarity`. Uneori o suprapunere de formulare e intenționată: aceeași idee, alt caz. Decizia e a omului. În interfață, duplicatele probabile apar debifate implicit — păstrarea lor e un act deliberat.

---

## Review-ul uman

`generateQuestionDrafts` **nu scrie nimic**. Există un test dedicat care verifică asta.

Adminul poate:
- **accepta** o întrebare ca atare;
- **edita** enunțul, opțiunile sau răspunsul corect;
- **respinge** ce nu-i place;
- vedea de care întrebare existentă seamănă un draft și cât de mult.

`saveQuestionDrafts` primește payload-ul din browser și **revalidează totul de la zero** — aceleași reguli de formă, deși au rulat deja la generare. Payload-ul a trecut prin client; nu are încredere în el.

La inserare:
- **Id-urile opțiunilor sunt atribuite pe server** (`opt_1`…`opt_4`), nu preluate din model, ca `correct_answer` să indice întotdeauna o opțiune care există.
- **`is_active = false`.** Întrebările salvate nu intră imediat în testele studenților. Adminul le activează din tabel, după o ultimă citire.
- Maximum 10 pe lot.

---

## Testare

**55 de teste** acoperă funcționalitatea.

`aiClient.test.ts` — configurație absentă, forma requestului, valorile implicite, propagarea opțiunilor, JSON curat, JSON în bloc marcat, JSON în bloc nemarcat, JSON înconjurat de proză, răspuns fără JSON, JSON malformat, răspuns gol, body invalid, eroare de provider fără scurgerea cheii, logare, timeout, abort, eroare de rețea.

`generateQuestions.test.ts` — categorie inexistentă (fără apel la model), propagarea erorii AI, zero întrebări returnate, conținutul promptului, limitarea la 10, ridicarea la 1, **zece forme invalide distincte**, numărarea celor aruncate, normalizarea spațiilor, duplicat față de baza de date, potrivire exactă după normalizare, întrebare pe alt subiect, duplicat în interiorul lotului, imunitate la cuvintele de umplutură, plus validarea și inserarea din `saveQuestionDrafts`.

```bash
npx vitest run tests/backend/aiClient.test.ts tests/backend/generateQuestions.test.ts
```

Niciun test nu apelează un model real: `askJSON` e mockuit, iar `fetch` e stubuit.

---

## Configurare

```env
AI_BASE_URL=https://.../v1     # fără /chat/completions la final
AI_API_KEY=...                 # fără prefixul NEXT_PUBLIC_
AI_MODEL=gemini-2.5-flash
```

Fără aceste variabile, butonul de generare raportează „AI is not configured”, iar restul aplicației nu e afectat.

---

## Limitări cunoscute

- **Corectitudinea factuală nu e verificată.** Validăm forma și unicitatea, nu adevărul. De aceea întrebările se salvează inactive și trec printr-un om.
- **Pragul de 0,6 e reglat empiric**, nu învățat din date. Prinde bine reformulările; două întrebări cu vocabular tehnic comun pot fi semnalate fals — de aceea sunt marcate, nu aruncate.
- **Jaccard compară cuvinte, nu sens.** Două întrebări care testează același lucru cu vocabular complet diferit trec nedetectate.
- **Lista `avoid` crește liniar** cu numărul de întrebări din categorie. La câteva mii, promptul devine costisitor și ar avea nevoie de eșantionare sau de căutare semantică.
- **Doar engleză.** Promptul nu cere o limbă anume; modelul răspunde în engleză.
