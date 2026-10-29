# Module 6 — Recommandations & Listes personnalisées (backend)

Responsable : Yasmine. Conforme au cahier des charges : Route Handlers `/api/...`, logique métier dans `src/modules/recommendations/`, collection MongoDB `customLists`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/modules/recommendations/types.ts` | Types (liste, film, recommandation) |
| `src/modules/recommendations/customList.model.ts` | Modèle Mongoose `customLists` |
| `src/modules/recommendations/customList.schema.ts` | Validation des entrées (zod) |
| `src/modules/recommendations/customList.service.ts` | CRUD des listes + ajout/retrait de films |
| `src/modules/recommendations/permissions.ts` | Règles d'accès (lecture / modification) |
| `src/modules/recommendations/ranking.ts` | Règles de classement des recommandations |
| `src/modules/recommendations/recommendation.service.ts` | Recommandations (TMDB + signaux utilisateur) |
| `src/modules/recommendations/errors.ts` | Erreurs HTTP homogènes `{ error }` |
| `src/modules/recommendations/session.ts` | Utilisateur connecté (session Auth.js) |
| `src/app/api/lists/**`, `src/app/api/recommendations/route.ts` | Endpoints HTTP |
| `src/lib/tmdb.ts` | Client TMDB partagé (à fusionner avec celui du Module 2) |
| `tests/recommendations/*.test.ts` | Tests unitaires (Vitest) |

Variables : `MONGODB_URI`, `AUTH_SECRET`, `TMDB_API_KEY`.

## Modèle `customLists`

```text
{ _id, userId, name, description, visibility, movies: [{ movieId, title, posterPath, genreIds, addedAt }], createdAt, updatedAt }
```
- Écart assumé avec le cahier : `movieIds` est remplacé par `movies` (identifiant **+ titre/affiche/genres**) pour afficher une liste sans rappeler TMDB et alimenter les recommandations par genre. L'API renvoie quand même `movieIds` (calculé).
- `movieId` = identifiant TMDB (≠ `_id` MongoDB).
- Index unique `{ userId, name }` insensible à la casse.

## Règles métier

- Nom : 2–50 caractères, unique par utilisateur (insensible à la casse). Description : 300 caractères max.
- `visibility` : `private` (défaut) ou `public`.
- 20 listes max par utilisateur, 100 films max par liste, pas de doublon de film dans une liste.
- Lecture : propriétaire, ou tout le monde si la liste est publique. Modification/suppression : propriétaire uniquement.
- L'utilisateur est toujours identifié par la session, jamais par un `userId` envoyé par le client.

## Endpoints

Toutes les erreurs ont le format `{ "error": "message" }`.
Codes communs : `400` entrée invalide · `401` non connecté · `403` interdit · `404` introuvable · `409` doublon/limite · `500` erreur serveur.

### GET /api/lists
- Auth : **requise**.
- Réponse `200` : `{ "lists": [CustomList, ...] }` (tri : dernière modification d'abord).
- Erreurs : `401`.

### POST /api/lists
- Auth : **requise**.
- Corps : `{ "name": string, "description"?: string, "visibility"?: "private" | "public" }`
- Réponse `201` : `CustomList`.
- Erreurs : `400` validation · `401` · `409` nom déjà utilisé ou 20 listes atteintes.

### GET /api/lists/[id]
- Auth : facultative.
- Autorisation : propriétaire, ou liste publique.
- Réponse `200` : `CustomList`.
- Erreurs : `400` id invalide · `403` liste privée d'un autre utilisateur · `404`.

### PATCH /api/lists/[id]
- Auth : **requise**. Autorisation : propriétaire.
- Corps (au moins un champ) : `{ "name"?: string, "description"?: string, "visibility"?: "private" | "public" }`
- Réponse `200` : `CustomList`.
- Erreurs : `400` · `401` · `403` · `404` · `409` nom déjà utilisé.

### DELETE /api/lists/[id]
- Auth : **requise**. Autorisation : propriétaire.
- Réponse `200` : `{ "message": "Liste supprimée." }`
- Erreurs : `400` · `401` · `403` · `404`.

### POST /api/lists/[id]/movies  *(endpoint ajouté au contrat, à valider par l'équipe)*
- Auth : **requise**. Autorisation : propriétaire.
- Corps : `{ "movieId": number, "title": string, "posterPath"?: string | null, "genreIds"?: number[] }`
- Réponse `201` : `CustomList` mise à jour.
- Erreurs : `400` · `401` · `403` · `404` · `409` film déjà présent ou 100 films atteints.

### DELETE /api/lists/[id]/movies/[movieId]  *(endpoint ajouté au contrat, à valider par l'équipe)*
- Auth : **requise**. Autorisation : propriétaire.
- Réponse `200` : `CustomList` mise à jour.
- Erreurs : `400` · `401` · `403` · `404` liste ou film absent.

### GET /api/recommendations?movieId=&limit=
- Auth : facultative.
- Paramètres : `movieId` (entier, facultatif) · `limit` (1–40, défaut 20).
- Réponse `200` : `{ "source": "personal" | "similar" | "trending", "results": [RecommendedMovie, ...] }`
  - avec `movieId` → films similaires (`similar`) ;
  - sans `movieId`, connecté avec des films en liste → recommandations personnalisées (`personal`) ;
  - sinon → tendances de la semaine (`trending`).
- Erreurs : `400` paramètre invalide · `500`.

### Formats

```json
// CustomList
{ "id": "...", "userId": "...", "name": "Mes films", "description": "", "visibility": "private",
  "movieIds": [550], "movies": [{ "movieId": 550, "title": "Fight Club", "posterPath": "/abc.jpg", "genreIds": [18], "addedAt": "..." }],
  "moviesCount": 1, "createdAt": "...", "updatedAt": "..." }

// RecommendedMovie
{ "movieId": 807, "title": "Seven", "overview": "...", "posterUrl": "https://image.tmdb.org/t/p/w500/...",
  "releaseDate": "1995-09-22", "rating": 8.4, "genreIds": [80, 9648], "reason": "Parce que vous avez ajouté Fight Club" }
```

## Logique de recommandation

1. **Signaux** : films des listes de l'utilisateur → les 3 plus récents (films de départ) + les 3 genres les plus fréquents.
2. **Candidats** : recommandations TMDB de chaque film de départ + films populaires des genres préférés.
3. **Score** = 2 × (nb de films de départ qui le recommandent) + 1 × (nb de genres préférés partagés) + note TMDB / 10.
4. Films déjà en liste exclus ; repli sur les tendances si aucun signal.

**Intégration prévue** : favoris (Module 4) et films bien notés (Module 3) s'ajoutent dans `getUserSignalMovies()` (`recommendation.service.ts`) au format `SignalMovie`, sans autre changement.

## Tests

```bash
npm test
```
27 tests unitaires : validation des entrées, permissions (propriétaire / public / privé / non connecté), règles de classement.
Tests d'intégration (base de test dédiée) et E2E Playwright : non faits.

### Test manuel (serveur lancé, connecté dans le navigateur)
GET : ouvrir `http://localhost:3000/api/lists` ou `http://localhost:3000/api/recommendations`.
POST/PATCH/DELETE : dans la console du navigateur (F12 → Console), sur `http://localhost:3000` :

```js
const api = async (url, method = "GET", body) => {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body && JSON.stringify(body) });
  console.log(res.status, await res.json());
};
await api("/api/lists", "POST", { name: "Mes films préférés" });              // 201 → copier l'id
await api("/api/lists/ID/movies", "POST", { movieId: 550, title: "Fight Club", genreIds: [18] }); // 201
await api("/api/lists/ID/movies", "POST", { movieId: 550, title: "Fight Club" }); // 409 doublon
await api("/api/recommendations");                                          // source: "personal"
await api("/api/lists/ID", "PATCH", { name: "Top films", visibility: "public" }); // 200
await api("/api/lists/ID/movies/550", "DELETE");                            // 200
await api("/api/lists/ID", "DELETE");                                       // 200
```
