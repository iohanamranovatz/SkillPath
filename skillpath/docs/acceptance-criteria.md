# Criterii de acceptanță

Cele 12 funcționalități obligatorii din brief, fiecare cu criteriile pe care le-am definit ca echipă, fișierele care le implementează și testele care le acoperă.

Formatul e Given / When / Then. Un criteriu fără test care să îl acopere e marcat explicit.

---

## 1. Autentificare și roluri

**Deținut de:** Diana Persa (înregistrare) · Octavian Istrate (roluri, protecția rutelor)

| # | Criteriu |
|---|---|
| 1.1 | **Dat** un vizitator pe `/signup`, **când** trimite un email valid și o parolă, **atunci** i se creează cont și primește email de confirmare |
| 1.2 | **Dat** un email deja înregistrat, **când** încearcă să se înscrie, **atunci** vede o eroare și nu se creează un al doilea cont |
| 1.3 | **Dat** un utilizator cu rol `user`, **când** se autentifică, **atunci** ajunge pe `/userDashboard` |
| 1.4 | **Dat** un utilizator cu rol `admin`, **când** se autentifică, **atunci** ajunge pe `/adminDashboard` |
| 1.5 | **Date** credențiale greșite, **când** se trimite formularul, **atunci** apare un mesaj de eroare fără a dezvălui dacă emailul există |
| 1.6 | **Dat** un student autentificat, **când** navighează la orice rută din `(admin)`, **atunci** e redirecționat spre `/login` |
| 1.7 | **Dat** un vizitator neautentificat, **când** cere o rută protejată, **atunci** e redirecționat spre `/login` |
| 1.8 | **Dat** un utilizator autentificat, **când** navighează prin aplicație, **atunci** sesiunea se reîmprospătează și nu expiră în timpul folosirii |
| 1.9 | **Dat** un utilizator autentificat, **când** apasă delogare, **atunci** sesiunea e distrusă și revine la login |

**Implementare:** `backend/auth/loginUser.ts`, `signUpUser.ts`, `logout.ts` · `app/(admin)/layout.tsx` · `proxy.ts` · `frontend/LoginForm.tsx`, `SignUpForm.tsx` · `backend/admin/actions/roleChange.ts`
**Teste:** `tests/backend/auth.test.ts`, `tests/backend/loginUser.test.ts`, `tests/frontend/auth-forms.test.tsx` · E2E: `e2e/public.spec.ts`

---

## 2. Profilul utilizatorului

**Deținut de:** Diana Persa

| # | Criteriu |
|---|---|
| 2.1 | **Dat** un student autentificat, **când** deschide `/profile`, **atunci** vede nivelul estimat, ariile de interes, obiectivele și istoricul testelor |
| 2.2 | **Dat** un student, **când** își modifică numele, **atunci** modificarea persistă și apare imediat |
| 2.3 | **Dat** un student, **când** adaugă un obiectiv de învățare, **atunci** acesta apare în listă cu status neîndeplinit |
| 2.4 | **Dat** un student cu 5 obiective, **când** încearcă să adauge al șaselea, **atunci** e refuzat cu un mesaj clar |
| 2.5 | **Dat** un obiectiv existent, **când** îi comută statusul, **atunci** starea se inversează și persistă |
| 2.6 | **Dat** un student, **când** își alege ariile de interes, **atunci** selecția se salvează în `user_interests` |
| 2.7 | **Dat** un student fără niciun test dat, **când** deschide profilul, **atunci** vede o stare goală explicită, nu o eroare |

**Implementare:** `app/(user)/profile/page.tsx` · `frontend/user/components/profile-view.tsx` · `backend/user/profile/updateProfile.ts`, `profileActions.ts`
**Teste:** `tests/backend/profile.test.ts`, `tests/frontend/user-views.test.tsx`

---

## 3. Catalogul de categorii

**Deținut de:** Octavian Istrate

| # | Criteriu |
|---|---|
| 3.1 | **Dat** un admin, **când** deschide `/categories`, **atunci** vede toate categoriile cu numărul de întrebări din fiecare |
| 3.2 | **Dat** un admin, **când** creează o categorie cu nume și descriere, **atunci** aceasta apare imediat în listă |
| 3.3 | **Dat** un nume de categorie gol sau format doar din spații, **când** se trimite, **atunci** e refuzat |
| 3.4 | **Dat** un admin, **când** redenumește o categorie, **atunci** întrebările asociate rămân legate de ea |
| 3.5 | **Dat** un admin, **când** șterge o categorie, **atunci** i se cere confirmare înainte |
| 3.6 | **Dat** un admin în detaliul unei categorii, **când** adaugă un tag, **atunci** acesta devine disponibil la crearea întrebărilor |
| 3.7 | **Dat** un admin, **când** adaugă o resursă de învățare cu titlu, URL și tip, **atunci** aceasta intră în recomandările pentru categoria respectivă |

**Implementare:** `backend/categories.ts` · `app/(admin)/categories/page.tsx`, `[id]/page.tsx` · `frontend/admin/Categories/*`
**Teste:** `tests/backend/categories.test.ts`, `tests/frontend/admin-categories.test.tsx`, `tests/integration/admin-pages.test.tsx`

---

## 4. Banca de întrebări

**Deținut de:** Octavian Istrate (CRUD) · Brigi Mranovatz (generare AI)

| # | Criteriu |
|---|---|
| 4.1 | **Dat** un admin, **când** deschide `/questions`, **atunci** vede toate întrebările cu categorie, dificultate și status |
| 4.2 | **Dat** un admin, **când** creează o întrebare cu opțiuni și marchează răspunsul corect, **atunci** aceasta se salvează |
| 4.3 | **Dată** o întrebare fără răspuns corect marcat, **când** se trimite, **atunci** e refuzată |
| 4.4 | **Dat** un admin, **când** editează o întrebare, **atunci** modificarea apare fără reîncărcarea paginii |
| 4.5 | **Dat** un admin, **când** dezactivează o întrebare, **atunci** aceasta nu mai apare în testele generate ulterior |
| 4.6 | **Dat** un admin, **când** șterge o întrebare, **atunci** rezultatele istorice care o referă rămân lizibile |
| 4.7 | **Dat** un admin, **când** cere generarea AI a N întrebări, **atunci** primește draft-uri de revizuit, iar în baza de date nu se scrie nimic |
| 4.8 | **Dat** un draft asemănător cu o întrebare existentă, **când** se afișează lista, **atunci** e marcat ca posibil duplicat, cu întrebarea sursă și scorul de similaritate |
| 4.9 | **Dat** un admin care acceptă draft-uri, **când** le salvează, **atunci** intră în bancă **inactive**, în așteptarea activării |

**Implementare:** `backend/admin/actions/questions.ts`, `generateQuestions.ts` · `app/(admin)/questions/` · `frontend/admin/Questions/*`
**Teste:** `tests/backend/questions.test.ts`, `tests/backend/generateQuestions.test.ts`, `tests/backend/aiClient.test.ts`, `tests/frontend/admin-questions.test.tsx` · E2E: `e2e/admin-panel.spec.ts`

---

## 5. Generarea testului

**Deținut de:** Diana Persa (teste pe categorie) · Brigi Mranovatz (testul de calibrare)

| # | Criteriu |
|---|---|
| 5.1 | **Dat** un student nou, **când** se autentifică prima dată, **atunci** e dus prin testul de calibrare de 30 de întrebări |
| 5.2 | **Dat** testul de calibrare, **când** se generează, **atunci** conține 10 întrebări din fiecare dintre cele 3 niveluri de dificultate |
| 5.3 | **Dat** un student care a răspuns deja corect la o întrebare, **când** se generează calibrarea, **atunci** acea întrebare e exclusă |
| 5.4 | **Dat** un student care și-a terminat calibrarea, **când** încearcă să o reia, **atunci** e refuzat |
| 5.5 | **Dat** un student cu o calibrare în curs, **când** revine, **atunci** o reia în loc să înceapă alta |
| 5.6 | **Dat** un student, **când** alege o categorie și pornește un test, **atunci** primește până la 10 întrebări active, amestecate |
| 5.7 | **Dată** o categorie fără întrebări active, **când** se cere un test, **atunci** apare un mesaj clar, nu un test gol |
| 5.8 | **Dat** un test generat, **când** se creează, **atunci** se scrie un rând `assessments` și câte un rând gol `assessment_answers` per întrebare |

**Implementare:** `backend/user/generateAssessment.ts` · `backend/user/assessments/initial/*` · `app/(user)/assessment/new/page.tsx` · `frontend/user/components/new-test-form.tsx`
**Teste:** `tests/backend/assessment.test.ts`, `tests/backend/initialAssessment.test.ts`, `tests/integration/assessment-flow.test.ts`

---

## 6. Parcurgerea și trimiterea testului

**Deținut de:** Diana Persa

| # | Criteriu |
|---|---|
| 6.1 | **Dat** un test în curs, **când** studentul îl deschide, **atunci** vede întrebările cu opțiunile lor, **fără** vreun indiciu despre răspunsul corect |
| 6.2 | **Dat** un student care răspunde la o întrebare, **când** trece mai departe, **atunci** răspunsul e salvat pe server |
| 6.3 | **Dat** un student în mijlocul testului, **când** reîncarcă pagina, **atunci** revine cu răspunsurile de până atunci intacte |
| 6.4 | **Dat** un test cu răspunsuri lipsă, **când** se trimite, **atunci** cele fără răspuns sunt tratate ca incorecte |
| 6.5 | **Dat** un test trimis, **când** se procesează, **atunci** statusul devine `completed` și se scrie `completed_at` |
| 6.6 | **Dat** un test deja trimis, **când** se încearcă retrimiterea, **atunci** e refuzată |
| 6.7 | **Dat** un test trimis, **când** se afișează rezultatul, **atunci** studentul ajunge pe pagina de rezultate |

**Implementare:** `app/(user)/assessment/[id]/page.tsx` · `frontend/user/components/assessment-runner.tsx`, `initial-assessment-runner.tsx` · `backend/user/saveProgressAssessment.ts`, `submitAssessment.ts`
**Teste:** `tests/backend/assessment.test.ts`, `tests/integration/assessment-flow.test.ts`, `tests/frontend/user-components.test.tsx` · E2E: `e2e/user-assessment.spec.ts`

---

## 7. Scoring și rezultate

**Deținut de:** Diana Persa

| # | Criteriu |
|---|---|
| 7.1 | **Dat** un test trimis, **când** se corectează, **atunci** corectarea se face exclusiv pe server, comparând cu `correct_answer` |
| 7.2 | **Dat** un rezultat, **când** se afișează, **atunci** studentul vede scorul total ca procent |
| 7.3 | **Dat** un test care acoperă mai multe categorii, **când** se afișează rezultatul, **atunci** apare un scor separat pentru fiecare categorie |
| 7.4 | **Dat** un rezultat, **când** se afișează, **atunci** categoriile sub 60% sunt marcate ca puncte slabe |
| 7.5 | **Dat** un rezultat, **când** studentul deschide recapitularea, **atunci** vede pentru fiecare întrebare ce a ales și care era răspunsul corect |
| 7.6 | **Dat** un student care trece teste (peste 75%) în mai multe categorii distincte, **când** se recalculează nivelul, **atunci** acesta urcă |
| 7.7 | **Dat** un student care trece de mai multe ori teste în aceeași categorie, **când** se recalculează nivelul, **atunci** acesta **nu** urcă — contează lățimea, nu repetiția |
| 7.8 | **Dat** un student cu un nivel stabilit, **când** obține ulterior un rezultat slab, **atunci** nivelul **nu** scade |
| 7.9 | **Dat** testul de calibrare, **când** se trimite, **atunci** nivelul se deduce din scorurile pe cele 3 transe |

**Implementare:** `backend/user/submitAssessment.ts`, `evaluateUserLevel.ts`, `results/getAssessmentAnalytics.ts` · `app/(user)/assessment/[id]/completed/page.tsx` · `frontend/user/components/results-view.tsx`, `answer-review.tsx`, `score-chart.tsx`, `skill-radar.tsx`
**Teste:** `tests/backend/evaluateUserLevel.test.ts`, `tests/backend/resultsAnalytics.test.ts`, `tests/backend/initialAssessment.test.ts`, `tests/frontend/user-views.test.tsx`

---

## 8. Planul de învățare recomandat

**Deținut de:** Diana Persa

> Bazat pe reguli, deterministic. **Nu** folosește AI — vezi [ai-features.md](ai-features.md).

| # | Criteriu |
|---|---|
| 8.1 | **Dat** un student cu categorii sub 60%, **când** deschide dashboard-ul, **atunci** primește resurse pentru acele categorii |
| 8.2 | **Dată** o recomandare, **când** e afișată, **atunci** are un motiv explicit („Boost your weakest area”) |
| 8.3 | **Dat** un student cu mai multe zone slabe, **când** se afișează recomandările, **atunci** cea mai slabă categorie e prima |
| 8.4 | **Dată** o categorie slabă fără resurse încărcate, **când** se generează planul, **atunci** e omisă, fără eroare |
| 8.5 | **Dat** un student fără zone slabe, **când** deschide dashboard-ul, **atunci** vede un mesaj pozitiv, nu o listă goală |
| 8.6 | **Dat** un student, **când** filtrează resursele după categorie sau tip, **atunci** lista se restrânge corespunzător |

**Implementare:** `backend/user/getDashboardData.ts` · `frontend/user/components/recommended-resources.tsx`, `resources-view.tsx`
**Teste:** `tests/backend/getDashboardData.test.ts`, `tests/frontend/user-views.test.tsx`

---

## 9. Urmărirea progresului

**Deținut de:** Brigi Mranovatz

| # | Criteriu |
|---|---|
| 9.1 | **Dat** un student cu istoric, **când** deschide dashboard-ul, **atunci** vede numărul de teste, media și nivelul curent |
| 9.2 | **Dat** un student cu mai multe teste, **când** se afișează evoluția, **atunci** vede scorul în ordine cronologică |
| 9.3 | **Dat** un student, **când** se afișează graficul radar, **atunci** vede competențele pe categorii |
| 9.4 | **Dat** un student cu un test în curs, **când** deschide dashboard-ul, **atunci** vede un card de continuare care duce direct la el |
| 9.5 | **Dat** un student, **când** deschide lista de teste, **atunci** vede rezultatele trecute cu dată, categorie și scor |
| 9.6 | **Dat** un student nou, fără date, **când** deschide dashboard-ul, **atunci** vede o stare goală care îl îndrumă spre primul test |

**Implementare:** `backend/user/getDashboardData.ts`, `getTests.ts` · `frontend/user/dashboard/UserDashboardUI.tsx` · `frontend/user/components/stat-cards.tsx`, `recent-results.tsx`, `continue-card.tsx`, `tests-view.tsx`
**Teste:** `tests/backend/getDashboardData.test.ts`, `tests/backend/userAnalytics.test.ts`, `tests/frontend/user-components.test.tsx` · E2E: `e2e/user-dashboard.spec.ts`

---

## 10. Dashboard-ul de admin

**Deținut de:** Brigi Mranovatz (agregări) · Octavian Istrate (interfață, administrare utilizatori)

| # | Criteriu |
|---|---|
| 10.1 | **Dat** un admin, **când** deschide `/adminDashboard`, **atunci** vede totalul de utilizatori, teste finalizate, întrebări și categorii |
| 10.2 | **Dat** un admin, **când** se afișează activitatea, **atunci** vede testele date în ultimele 7 zile |
| 10.3 | **Dat** un admin, **când** se afișează topul, **atunci** vede utilizatorii cu cele mai bune rezultate |
| 10.4 | **Dat** un admin, **când** deschide categoriile slabe, **atunci** vede zonele cu cele mai slabe rezultate la nivel de grupă |
| 10.5 | **Dat** un admin, **când** deschide administrarea utilizatorilor, **atunci** vede toți utilizatorii cu rol și nivel estimat |
| 10.6 | **Dat** un admin, **când** deschide profilul unui student, **atunci** vede testele lui și răspunsurile date |
| 10.7 | **Dat** un admin, **când** schimbă rolul unui utilizator, **atunci** noul rol se aplică la următoarea lui autentificare |
| 10.8 | **Dat** un admin, **când** adaugă un utilizator, **atunci** acesta apare în listă |
| 10.9 | **Dat** un sistem fără date, **când** adminul deschide dashboard-ul, **atunci** vede zerouri, nu erori |

**Implementare:** `backend/admin/getAdminDashboardData.ts`, `getWeakCategories.ts`, `addUser.ts` · `app/(admin)/adminDashboard/`, `weakCategories/`, `manageUsers/` · `frontend/admin/dashboard/`, `frontend/admin/components/`, `frontend/admin/ManageUsers/`
**Teste:** `tests/backend/getAdminDashboardData.test.ts`, `tests/backend/admin.test.ts`, `tests/frontend/admin-dashboard.test.tsx`, `tests/integration/admin-pages.test.tsx` · E2E: `e2e/admin-panel.spec.ts`

---

## 11. Căutare și filtrare

**Deținut de:** Octavian Istrate

| # | Criteriu |
|---|---|
| 11.1 | **Dat** un admin în banca de întrebări, **când** scrie în câmpul de căutare, **atunci** lista se restrânge după enunț |
| 11.2 | **Dat** un admin, **când** filtrează după categorie, dificultate sau status, **atunci** filtrele se combină |
| 11.3 | **Dat** un filtru activ, **când** adminul îl golește, **atunci** revine lista completă |
| 11.4 | **Dat** un admin în administrarea utilizatorilor, **când** caută un nume sau email, **atunci** lista se restrânge |
| 11.5 | **Dat** un student, **când** filtrează resursele după categorie sau tip, **atunci** lista se restrânge |
| 11.6 | **Dată** o listă lungă, **când** e afișată, **atunci** e paginată |
| 11.7 | **Dată** o căutare fără rezultate, **când** se afișează, **atunci** apare un mesaj de listă goală, nu un tabel gol |

**Implementare:** `frontend/admin/Questions/search-bar.tsx`, `filter.tsx`, `toolbar.tsx` · `frontend/admin/ManageUsers/toolbar.tsx` · `app/(admin)/manageUsers/[id]/ResourceFilters.tsx` · `frontend/components/pagination.tsx`
**Teste:** `tests/frontend/admin-questions.test.tsx`, `tests/frontend/user-views.test.tsx`, `tests/frontend/user-common.test.tsx`

---

## 12. Documentație

**Deținut de:** toată echipa

| # | Criteriu |
|---|---|
| 12.1 | **Dat** un dezvoltator nou, **când** urmează doar `README.md`, **atunci** pornește aplicația local fără ajutor |
| 12.2 | **Dat** repo-ul, **când** e clonat, **atunci** `README.md` listează toate variabilele de mediu necesare, cu rolul fiecăreia |
| 12.3 | **Dat** un dezvoltator nou, **când** citește `docs/architecture.md`, **atunci** înțelege fluxul unui request și deciziile luate |
| 12.4 | **Dată** absența migrărilor, **când** cineva trebuie să recreeze baza de date, **atunci** `docs/database-schema.md` descrie complet schema |
| 12.5 | **Dat** documentul de față, **când** e citit, **atunci** fiecare funcționalitate are criterii verificabile, cu fișiere și teste |
| 12.6 | **Dat** un contribuitor, **când** citește `AGENTS.md`, **atunci** știe convențiile și ce trebuie să ruleze înainte de PR |
| 12.7 | **Dat** cineva care evaluează calitatea, **când** citește `docs/testing.md`, **atunci** poate rula fiecare nivel de testare |

**Implementare:** `README.md`, `AGENTS.md`, `docs/`, `e2e/README.md`

---

## Ce am tăiat conștient

Scopul negociat la începutul proiectului, cu ce a rămas în afara lui și de ce:

| Tăiat | Motiv |
|---|---|
| Test cronometrat, cu limită de timp | Adaugă gestiune de stare și cazuri-limită (ce se întâmplă la expirare în mijlocul unui răspuns) fără să schimbe valoarea demonstrată |
| Notificări pe email la finalizarea unui test | Depinde de un furnizor extern de email; nu aduce nimic la evaluare |
| Export CSV al rezultatelor | Util în producție, irelevant pentru demo |
| Câte un feature AI per membru | Un singur feature AI, dus până la capăt și complet testat, valorează mai mult decât trei superficiale |
| Migrări versionate | Decizie luată la început, asumată ca datorie tehnică; vezi [architecture.md](architecture.md) |
