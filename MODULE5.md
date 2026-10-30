# Module 5 — Movie Discovery (backend)

Conforme au cahier des charges : Route Handlers `/api/search` et `/api/saved-searches`, logique dans `src/modules/discovery/`.
- **Recherche / découverte** : lecture seule sur TMDB.
- **Recherches sauvegardées (CRUD)** : collection MongoDB `savedSearches` — l'utilisateur connecté enregistre une recherche (nom + filtres), la consulte, la modifie, la supprime et la relance.

## Fichiers
- `src/modules/discovery/discovery.types.ts` — types (film, réponse, tri)
- `src/modules/discovery/discovery.schema.ts` — validation des paramètres (zod)
- `src/modules/discovery/discovery.service.ts` — logique métier (recherche, filtres, tri, pagination, état vide)
- `src/app/api/search/route.ts` — `GET /api/search`
- `src/app/api/search/genres/route.ts` — `GET /api/search/genres`
- `src/modules/discovery/savedSearch.model.ts` — modèle Mongoose `SavedSearch` (collection `savedSearches`)
- `src/modules/discovery/savedSearch.schema.ts` — validation (zod) création / modification
- `src/modules/discovery/savedSearch.service.ts` — logique CRUD + règles métier
- `src/modules/discovery/http.ts` — erreurs HTTP, lecture JSON, utilisateur connecté
- `src/app/api/saved-searches/route.ts` — `GET` (liste) / `POST` (création)
- `src/app/api/saved-searches/[id]/route.ts` — `GET` / `PATCH` / `DELETE`
- `src/app/api/saved-searches/[id]/results/route.ts` — relance la recherche sur TMDB
- `src/lib/tmdb.ts` — client TMDB partagé (identique à celui du Module 6 ; à fusionner avec celui de Baha / Module 2)

Variables requises : `TMDB_API_KEY`, `MONGODB_URI`, `AUTH_SECRET`.

## GET /api/search
Authentification : non requise.

| Paramètre | Type | Défaut | Règle |
|---|---|---|---|
| `query` | texte | — | 1–100 caractères (recherche par titre) |
| `genre` | entier | — | id de genre TMDB (voir `/api/search/genres`) |
| `year` | entier | — | 1900 → année courante + 5 |
| `minRating` | nombre | — | 0–10 |
| `sortBy` | `popularity` \| `rating` \| `release_date` \| `title` | `popularity` | |
| `page` | entier | 1 | 1–500 |

Réponse 200 :
```json
{
  "results": [{ "movieId": 550, "title": "Fight Club", "overview": "...", "posterUrl": "https://...", "releaseDate": "1999-10-15", "year": 1999, "rating": 8.4, "voteCount": 30000, "genreIds": [18] }],
  "page": 1, "totalPages": 12, "totalResults": 230,
  "isEmpty": false, "emptyMessage": null
}
```
Erreurs : `400` paramètre invalide (`{ "error": "..." }`), `502` TMDB indisponible.

Fonctionnement :
- **Avec `query`** : TMDB `/search/movie` (titre + année). Genre, note minimale et tri sont appliqués sur la page reçue (TMDB ne les gère pas en recherche texte) → une page peut contenir moins de 20 films.
- **Sans `query`** : TMDB `/discover/movie`, tous les filtres et le tri sont faits par TMDB. Tri par note : seulement les films avec ≥ 100 votes.
- **Aucun résultat** : `isEmpty: true` + `emptyMessage` prêt à afficher.

## GET /api/search/genres
Réponse 200 : `{ "genres": [{ "id": 28, "name": "Action" }, ...] }`

## Tests rapides (navigateur, serveur lancé)
- http://localhost:3000/api/search?query=batman
- http://localhost:3000/api/search?query=batman&sortBy=release_date&page=2
- http://localhost:3000/api/search?genre=28&year=2020&minRating=7&sortBy=rating
- http://localhost:3000/api/search?sortBy=title
- http://localhost:3000/api/search?query=zzzzqqq → isEmpty: true
- http://localhost:3000/api/search?year=1800 → 400
- http://localhost:3000/api/search/genres

---

# CRUD — Recherches sauvegardées

Authentification : **requise** (session NextAuth). L'utilisateur est toujours pris dans la session, jamais dans la requête.
Chaque utilisateur ne voit et ne modifie **que ses propres** recherches (sinon `404`).

| Action | Méthode + URL | Corps JSON | Succès |
|---|---|---|---|
| **C** Créer | `POST /api/saved-searches` | `{ "name": "Action 2020", "filters": { "genre": 28, "year": 2020, "minRating": 7, "sortBy": "rating" } }` | `201` |
| **R** Lister | `GET /api/saved-searches` | — | `200` `{ "savedSearches": [...] }` |
| **R** Détail | `GET /api/saved-searches/:id` | — | `200` |
| **R** Relancer | `GET /api/saved-searches/:id/results?page=1` | — | `200` (même format que `/api/search`) |
| **U** Modifier | `PATCH /api/saved-searches/:id` | `{ "name": "..." }` et/ou `{ "filters": {...} }` (les filtres envoyés remplacent les anciens) | `200` |
| **D** Supprimer | `DELETE /api/saved-searches/:id` | — | `200` |

`filters` : mêmes règles que `GET /api/search` (`query`, `genre`, `year`, `minRating`, `sortBy`), sans `page`. Facultatif à la création (défaut : `{ "sortBy": "popularity" }`).

Règles métier :
- nom : 2 à 50 caractères, unique par utilisateur (insensible à la casse) → sinon `409` ;
- 20 recherches sauvegardées maximum par utilisateur → sinon `409`.

Erreurs : `400` données ou id invalides, `401` non connecté, `404` introuvable (ou appartient à un autre utilisateur), `409` conflit, `502` TMDB indisponible (relance).

## Tester le CRUD (navigateur)
1. `npm run dev`, puis se connecter sur http://localhost:3000/login
2. Sur une page de l'application, ouvrir la console (F12 → Console) et coller :
```js
const api = (url, method = "GET", body) =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body && JSON.stringify(body) })
    .then(async r => { const d = await r.json(); console.log(method, url, r.status, d); return d; });

// C
const s = await api("/api/saved-searches", "POST", { name: "Action 2020", filters: { genre: 28, year: 2020, minRating: 7, sortBy: "rating" } });
// R
await api("/api/saved-searches");
await api(`/api/saved-searches/${s.id}`);
await api(`/api/saved-searches/${s.id}/results`);
// U
await api(`/api/saved-searches/${s.id}`, "PATCH", { name: "Action 2021", filters: { genre: 28, year: 2021 } });
// D
await api(`/api/saved-searches/${s.id}`, "DELETE");
await api("/api/saved-searches");
```
3. Cas d'erreur à essayer : créer deux fois le même nom (`409`), `name: "a"` (`400`), `year: 1800` (`400`), appeler l'API après déconnexion (`401`), id inventé `/api/saved-searches/123` (`400`).
4. Vérifier dans MongoDB Compass : base du projet → collection `savedSearches`.
