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

## Nota istorica: sesiunea partajata (rezolvat)

Testele de protectie a rutelor au scos initial la iveala o problema reala de
securitate: `helper/SupabaseClient.js` crea **un singur client** la nivel de
modul, iar `loginUser` este o server action — deci `signInWithPassword` rula in
procesul Node si salva sesiunea in memoria acelui client, comuna tuturor
cererilor. Oricine se autentifica, oricine deschidea `/profile` vedea profilul
lui.

**Problema este rezolvata.** Fisierul nu mai exista. Aplicatia foloseste acum
`@supabase/ssr` cu un client construit **per request** din cookie-urile cererii
(`helper/supabase/server.ts`), iar `proxy.ts` reimprospateaza token-ul la
fiecare navigare.

Ce a ramas din perioada aceea, si de ce:

- **`e2e/session.ts`** — fiecare suita se autentifica prin interfata. Acum ca
  sesiunea sta in cookie-uri, ar putea fi inlocuit cu `storageState`. Nu am
  facut schimbarea in *feature freeze*.
- **`workers: 1`** — ramane necesar din alt motiv: suitele scriu in aceeasi baza
  de date si s-ar incurca reciproc daca ar rula in paralel.

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
