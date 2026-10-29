# Module 5 — Movie Discovery (backend)

Conforme au cahier des charges : Route Handler `/api/search`, logique dans `src/modules/discovery/`.
Pas de collection MongoDB : le module lit uniquement TMDB.

## Fichiers
- `src/modules/discovery/discovery.types.ts` — types (film, réponse, tri)
- `src/modules/discovery/discovery.schema.ts` — validation des paramètres (zod)
- `src/modules/discovery/discovery.service.ts` — logique métier (recherche, filtres, tri, pagination, état vide)
- `src/app/api/search/route.ts` — `GET /api/search`
- `src/app/api/search/genres/route.ts` — `GET /api/search/genres`
- `src/lib/tmdb.ts` — client TMDB partagé (identique à celui du Module 6 ; à fusionner avec celui de Baha / Module 2)

Variable requise : `TMDB_API_KEY`.

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
