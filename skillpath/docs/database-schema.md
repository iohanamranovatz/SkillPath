# Schema bazei de date

PostgreSQL, găzduit în Supabase. **Schema nu este versionată în repo** — nu există migrări, structura e administrată din Supabase Studio. Documentul acesta este singura descriere completă a ei; dacă modifici structura, actualizează-l în același PR.

Coloanele de mai jos sunt cele efectiv folosite de aplicație, extrase din interogările din `backend/`.

## Diagramă

```
                    ┌───────────────┐
                    │   categories  │
                    │───────────────│
       ┌───────────►│ id            │◄──────────┐
       │            │ name          │           │
       │            │ description   │           │
       │            │ difficulty    │           │
       │            └───────┬───────┘           │
       │                    │                   │
       │        ┌───────────┼───────────┐       │
       │        ▼           ▼           ▼       │
       │  ┌──────────┐ ┌─────────┐ ┌──────────────────┐
       │  │   tags   │ │questions│ │learning_resources│
       │  │──────────│ │─────────│ │──────────────────│
       │  │ id       │ │ id      │ │ id               │
       │  │ name     │ │ text    │ │ title, url, type │
       │  │category_id│ │options  │ └──────────────────┘
       │  └────┬─────┘ │correct  │
       │       └──────►│tag_id   │
       │               │is_active│
       │               └────┬────┘
       │                    │
┌──────┴────────┐           │
│ user_interests│           │
└──────┬────────┘           │
       │                    │
┌──────▼────────┐    ┌──────▼──────────────┐
│     users     │    │ assessment_answers  │
│───────────────│    │─────────────────────│
│ id            │    │ id                  │
│ name, email   │    │ assessment_id       │──┐
│ role          │    │ question_id         │  │
│estimated_level│    │ selected_option_id  │  │
└──┬─────────┬──┘    │ is_correct          │  │
   │         │       └─────────────────────┘  │
   │         │                                │
   │    ┌────▼──────────────┐                 │
   │    │  user_objectives  │                 │
   │    └───────────────────┘                 │
   │                                          │
   │         ┌────────────────┐               │
   └────────►│  assessments   │◄──────────────┘
             │────────────────│
             │ id, user_id    │
             │ status         │
             │ score_total    │
             │ started_at     │
             │ completed_at   │
             └────────────────┘
```

---

## Tabele

### `users`
Profilul aplicativ. Distinct de `auth.users`, tabela internă a Supabase Auth; legătura se face pe email la autentificare.

| Coloană | Tip | Note |
|---|---|---|
| `id` | `bigint` PK | |
| `name` | `text` | Numele afișat |
| `email` | `text` | Unic |
| `role` | `text` | `user` sau `admin`. Determină redirecționarea și accesul la grupul `(admin)` |
| `estimated_level` | `text` | `Beginner` / `Intermediate` / `Advanced`. Scris de `evaluateUserLevel` și de testul de calibrare |

### `categories`
Catalogul de competențe (Frontend, Backend, Database …).

| Coloană | Tip | Note |
|---|---|---|
| `id` | `bigint` PK | |
| `name` | `text` | Unic; generatorul AI rezolvă categoria după nume |
| `description` | `text` | Trimisă modelului ca context la generare |
| `difficulty` | `text` | Nivelul categoriei. **Testul de calibrare grupează după această coloană**, nu după dificultatea întrebării |

### `tags`
Subteme din interiorul unei categorii.

| Coloană | Tip | Note |
|---|---|---|
| `id` | `bigint` PK | |
| `name` | `text` | |
| `category_id` | `bigint` FK → `categories.id` | |

### `questions`
Banca de întrebări grilă.

| Coloană | Tip | Note |
|---|---|---|
| `id` | `bigint` PK | |
| `question_text` | `text` | Enunțul complet |
| `title` | `text` | Opțional. Dacă lipsește, lista de admin afișează primele 30 de caractere din enunț |
| `category_id` | `bigint` FK → `categories.id` | |
| `tag_id` | `bigint` FK → `tags.id` | Opțional |
| `difficulty` | `text` | `EASY` / `MEDIUM` / `HARD`. Informativ — selecția pentru calibrare folosește dificultatea categoriei |
| `options` | `jsonb` | `[{ "id": "opt_1", "text": "…" }, …]`. Exact 4 la întrebările generate cu AI |
| `correct_answer` | `text` | `id`-ul opțiunii corecte, ex. `opt_3`. **Nu părăsește niciodată serverul înainte de trimiterea testului** |
| `is_active` | `boolean` | Doar întrebările active intră în teste. Draft-urile AI se salvează cu `false` |

### `assessments`
O sesiune de test.

| Coloană | Tip | Note |
|---|---|---|
| `id` | `bigint` PK | |
| `user_id` | `bigint` FK → `users.id` | |
| `status` | `text` | `in_progress` sau `completed` |
| `score_total` | `integer` | Procent, 0-100. Scris la trimitere |
| `started_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | `null` cât timp testul e în curs |

> Nu există coloană care să marcheze testul de calibrare. E identificat prin faptul că are exact 30 de rânduri în `assessment_answers` (`isInitialAssessment`). Un flag dedicat ar fi mai robust — vezi limitările din [architecture.md](architecture.md).

### `assessment_answers`
Un rând per întrebare dintr-un test. **Se creează goale în momentul generării testului**, nu la răspuns — de aceea progresul supraviețuiește unui refresh.

| Coloană | Tip | Note |
|---|---|---|
| `id` | `bigint` PK | Ordinea de inserare definește transele de câte 10 la calibrare |
| `assessment_id` | `bigint` FK → `assessments.id` | |
| `question_id` | `bigint` FK → `questions.id` | |
| `selected_option_id` | `text` | `null` cât timp nu s-a răspuns |
| `is_correct` | `boolean` | `null` până la corectare. Calculat exclusiv pe server |

### `learning_resources`
Materiale recomandate pentru o categorie.

| Coloană | Tip | Note |
|---|---|---|
| `id` | `bigint` PK | |
| `title` | `text` | |
| `url` | `text` | |
| `type` | `text` | Articol, video, curs … |
| `category_id` | `bigint` FK → `categories.id` | Baza recomandărilor pentru categoriile slabe |

### `user_objectives`
Obiectivele de învățare definite de student. Maximum 5 active, limită impusă în `backend/user/profile/profileActions.ts`.

| Coloană | Tip | Note |
|---|---|---|
| `id` | `bigint` PK | |
| `user_id` | `bigint` FK → `users.id` | |
| `title` | `text` | |
| `is_completed` | `boolean` | Comutat din profil |

### `user_interests`
Ariile de interes alese de student. Tabelă de legătură many-to-many.

| Coloană | Tip | Note |
|---|---|---|
| `user_id` | `bigint` FK → `users.id` | |
| `category_id` | `bigint` FK → `categories.id` | |

---

## Interogări de reținut

- **Categoriile slabe la nivel de grupă** (`backend/admin/getWeakCategories.ts`) urcă prin două join-uri: `assessment_answers → questions → categories`, cu `!inner` ca să excludă rândurile fără corespondent.
- **Întrebările „stăpânite”** (`getMasteredQuestionIds`) filtrează `assessment_answers` după `assessments.user_id` printr-un join `!inner`, ca testul de calibrare să nu repete întrebări la care studentul a răspuns deja corect.
- **Numărarea răspunsurilor** folosește `select("id", { count: "exact", head: true })` — aduce numărul fără rânduri.

## Configurare inițială

Ordinea de creare, respectând cheile străine:

1. `users`, `categories`
2. `tags`, `questions`, `learning_resources`, `user_interests`, `user_objectives`
3. `assessments`
4. `assessment_answers`

Activează RLS pe fiecare tabelă. Regula minimă: un utilizator vede doar propriile `assessments`, `assessment_answers`, `user_objectives` și `user_interests`; conținutul (`categories`, `tags`, `questions`, `learning_resources`) e lizibil de toți autentificații, dar scris doar de `admin`.
