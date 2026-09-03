# Teste E2E (Playwright)

Testele ruleaza pe aplicatia adevarata, pornita cu `npm run dev`, si lovesc
Supabase-ul real configurat in `.env.local`.

## Setup (o singura data)

1. Instaleaza browserul folosit de Playwright:

   ```bash
   npx playwright install chromium
   ```

2. Copiaza fisierul de exemplu si completeaza credentialele:

   ```bash
   cp e2e/.env.test.local.example e2e/.env.test.local
   ```

   `e2e/.env.test.local` este in `.gitignore` — parolele nu ajung niciodata in repo.

## Rulare

```bash
npm run e2e
```

Alte comenzi utile:

| Comanda | Ce face |
|---|---|
| `npm run e2e:public` | doar suita publica — **nu are nevoie de conturi** si nu scrie nimic |
| `npm run e2e:ui` | modul interactiv, cu time-travel prin pasi |
| `npm run e2e:report` | deschide raportul HTML al ultimei rulari |

Serverul de dev porneste automat. Daca il ai deja pornit pe `localhost:3000`,
Playwright il refoloseste.

## ⚠️ Sesiunea este comuna tuturor vizitatorilor

Testele de protectie a rutelor au scos la iveala o problema reala de securitate
in aplicatie. `helper/SupabaseClient.js` creeaza **un singur client** la nivel de
modul, iar `loginUser` este o server action — deci `signInWithPassword` ruleaza
in procesul Node si salveaza sesiunea in memoria acelui client, **comuna tuturor
cererilor**. Nu exista cookie-uri de sesiune.

Reproducere:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/profile   # 307 -> /
# ...oricine se logheaza, in orice browser...
curl -s http://localhost:3000/profile                                     # 200 + profilul lui
```

Consecinte in teste: `storageState` (sesiuni salvate per browser) nu are efect,
pentru ca serverul nu se uita la cookie-uri. De aceea fiecare suita se logheaza
explicit prin interfata (`e2e/session.ts`), rularea este secventiala
(`workers: 1`), iar suita `public` ruleaza prima si inchide orice sesiune activa
inainte de a verifica protectia rutelor.

Dupa ce sesiunile vor fi mutate pe cookie-uri (`@supabase/ssr`, client creat
per-request), `e2e/session.ts` poate fi inlocuit cu `storageState` si `workers: 1`
poate disparea.

## Conturi de test

Ai nevoie de **doua conturi cu email confirmat**: unul cu rolul `user` si unul
cu rolul `admin`. Aplicatia nu permite crearea unui admin din interfata — rolul
se seteaza din tabela `users` in Supabase, sau dintr-un cont de admin existent
prin *Manage users*.

Suitele care au nevoie de login se marcheaza automat ca **skipped** daca
credentialele lipsesc, deci `npm run e2e` nu pica pe un checkout curat.

## Ce date modifica testele

Testele sunt scrise sa curete dupa ele, dar nu toate operatiile sunt reversibile
din interfata:

| Suita | Efect asupra datelor |
|---|---|
| `public.spec.ts` | niciunul |
| `user-dashboard.spec.ts` | adauga un obiectiv si **il sterge** la final |
| `user-assessment.spec.ts` | **creeaza un assessment + raspunsuri** care raman in baza de date; poate schimba `estimated_level` al contului |
| `admin-panel.spec.ts` | creeaza o categorie temporara si **o sterge** la final; restul e doar citire |

Din acest motiv foloseste conturi de test dedicate, nu conturi reale. Rularea
este secventiala (`workers: 1`) tocmai ca doua teste sa nu se calce in picioare
pe aceleasi date.

## Structura

| Fisier | Continut |
|---|---|
| `credentials.ts` | citeste credentialele din env, fara valori hardcodate |
| `session.ts` | login prin interfata + inchiderea sesiunii de pe server |
| `public.spec.ts` | landing page, validari de formular, protectia rutelor |
| `user-dashboard.spec.ts` | navigare intre vizualizari, filtre, profil, sign out |
| `user-assessment.spec.ts` | fluxul complet: generare test -> raspunsuri -> scor -> revizuire |
| `admin-panel.spec.ts` | dashboard, question bank, manage users, categorii |
