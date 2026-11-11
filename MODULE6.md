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
| `src/modules/recommendations/recommendation.service.ts` | Recommandations (catalogue + signaux utilisateur) |
| `src/modules/recommendations/catalogue.ts` | Lecture des films du catalogue (Module 2) et de la note des spectateurs (Module 3) |
| `src/modules/recommendations/errors.ts` | Erreurs HTTP homogènes `{ error }` |
| `src/modules/recommendations/session.ts` | Utilisateur connecté (session Auth.js) |
| `src/app/api/lists/**`, `src/app/api/recommendations/route.ts` | Endpoints HTTP |
| `tests/recommendations/*.test.ts` | Tests unitaires (Vitest) |

Variables : `MONGODB_URI`, `AUTH_SECRET`. Aucune clé TMDB : tous les films viennent du catalogue (collection `movies`).

## Modèle `customLists`

```text
{ _id, userId, name, description, visibility, movies: [{ movieId, addedAt }], createdAt, updatedAt }
```
- `movieId` = identifiant du film dans le catalogue (Module 2). Seuls l'identifiant et la date d'ajout sont stockés : titre, affiche et genres sont lus dans le catalogue à chaque lecture (règle du cahier : pas de copie des fiches). Un film retiré du catalogue disparaît de la liste. L'API renvoie aussi `movieIds` (calculé).
- Index unique `{ userId, name }` insensible à la casse.

## Règles métier

- Nom : 2–50 caractères, unique par utilisateur (insensible à la casse). Description : 300 caractères max.
- `visibility` : `private` (défaut) ou `public`.
- 20 listes max par utilisateur, 100 films max par liste, pas de doublon de film dans une liste.
- Lecture : propriétaire, ou tout le monde si la liste est publique. Modification/suppression : propriétaire uniquement.
- L'utilisateur est toujours identifié par la session, jamais par un `userId` envoyé par le client.

## Endpoints

Toutes les erreurs ont le format `{ "error": "message" }`.
Codes communs : `400` entrée invalide · `401` non connecté · `403` interdit · `404` introuvable · `409` doublon/limite · `500` erreur serveur · `503` base de données injoignable (« … ne répond pas. Vérifiez votre connexion internet puis réessayez. »).

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
- Corps : `{ "movieId": string }` (identifiant du catalogue)
- Réponse `201` : `CustomList` mise à jour.
- Erreurs : `400` · `401` · `403` · `404` liste ou film absent du catalogue · `409` film déjà présent ou 100 films atteints.

### DELETE /api/lists/[id]/movies/[movieId]  *(endpoint ajouté au contrat, à valider par l'équipe)*
- Auth : **requise**. Autorisation : propriétaire.
- Réponse `200` : `CustomList` mise à jour.
- Erreurs : `400` · `401` · `403` · `404` liste ou film absent.

### GET /api/recommendations?trending=&listId=&movieId=&limit=
- Auth : facultative.
- Paramètres : `trending` (`true` pour les tendances, facultatif) · `listId` (id MongoDB, facultatif) · `movieId` (id du catalogue, facultatif) · `limit` (1–40, défaut 20).
- Réponse `200` : `{ "source": "list" | "personal" | "similar" | "trending", "results": [RecommendedMovie, ...] }`
  - avec `listId` → recommandations basées uniquement sur cette liste (`list`) ; mêmes droits que la lecture de la liste (`403` / `404`) ;
  - avec `movieId` → films similaires (`similar`) ;
  - sans `movieId`, connecté avec des films en liste → recommandations personnalisées (`personal`) ;
  - sinon → tendances : les films les mieux notés (`trending`).
- Erreurs : `400` paramètre invalide · `500`.

### Formats

```json
// CustomList
{ "id": "...", "userId": "...", "name": "Mes films", "description": "", "visibility": "private",
  "movieIds": ["6af3..."], "movies": [{ "movieId": "6af3...", "title": "Fight Club", "posterUrl": "https://...", "genres": ["Drame"], "addedAt": "..." }],
  "moviesCount": 1, "createdAt": "...", "updatedAt": "..." }

// RecommendedMovie
{ "movieId": "6af3...", "title": "Seven", "overview": "...", "posterUrl": "https://...",
  "backdropUrl": "https://..." | null, "year": 1995, "rating": 8.4, "genres": ["Crime", "Mystère"],
  "reason": "Parce que vous avez ajouté Fight Club", "match": 94 }
```

## Logique de recommandation

1. **Signaux** : films des listes de l'utilisateur → les 3 plus récents (films de départ) + les 3 genres les plus fréquents.
2. **Candidats** (films du catalogue) : pour chaque film de départ, les films du même réalisateur ou d'au moins un genre commun + les films des genres préférés.
3. **Score** = 2 × (nb de films de départ dont il est proche) + 1 × (nb de genres préférés partagés) + note / 10. Note = moyenne des spectateurs (Module 3) × 2 dès 3 votes, sinon note du catalogue.
4. Films déjà en liste exclus ; repli sur les tendances (films les mieux notés) si aucun signal.
5. **Compatibilité** (`match`) : le score est converti en pourcentage de 55 à 99 % (`toMatchPercent`), 99 % correspondant au score maximal possible (tous les films de départ le recommandent, tous les genres préférés, note 10/10). `null` pour les tendances et les films similaires.

**Favoris (Module 4)** : `getUserSignalMovies()` lit aussi les favoris de l'utilisateur directement en base (collection `collectionItems`, `favorite: true`, champ `movie.movieId` = identifiant du catalogue), sans dépendre du code du Module 4. Tant que ce module n'est pas fusionné, la collection est vide et rien ne change. Ils ne sont utilisés que pour les recommandations globales (sans `listId`).
**Notes (Module 3)** : `getUserSignalMovies()` lit aussi la collection `ratings` (`userId`, `movieId`, `score` de 1 à 5), directement en base. Un film noté **4 ou 5** devient un signal (raison : « D'après les films que vous avez bien notés », titre non stocké par le Module 3). **Tout film déjà noté**, même mal, est exclu des recommandations : l'utilisateur l'a déjà vu. Uniquement pour les recommandations globales (sans `listId`).

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
await api("/api/lists/ID/movies", "POST", { movieId: "FILM_ID" });           // 201 (FILM_ID : id d'un film de /movies)
await api("/api/lists/ID/movies", "POST", { movieId: "FILM_ID" });           // 409 doublon
await api("/api/recommendations");                                          // source: "personal"
await api("/api/lists/ID", "PATCH", { name: "Top films", visibility: "public" }); // 200
await api("/api/lists/ID/movies/FILM_ID", "DELETE");                        // 200
await api("/api/lists/ID", "DELETE");                                       // 200
```

## Interface

| Page | Contenu |
|---|---|
| `/recommendations` | Bannière du film n°1 (compatibilité + genres), Top 10 pour vous, rangées par genre, « Inspiré de votre liste », tendances de la semaine |
| `/lists` | Mes listes (couverture en mosaïque, visibilité), création |
| `/lists/[id]` | Détail : ajouter des films (recherche + suggestions), modifier, partager, supprimer ; lecture seule pour la liste publique d'un autre utilisateur |

- Code : `src/app/(streaming)/` (pages + thème `streaming.css`) et `src/components/recommendations/`.
- Ajout d'un film : bouton + sur chaque affiche, ou fenêtre « Ajouter des films ». La recherche utilise `GET /api/search` (Module 5, catalogue). La fiche rapide d'un film mène à sa page `/movies/[id]` (avis du Module 3).
- Bannière en carrousel (5 films, fondu) : pause au survol et au focus, bouton pause, désactivée si l'utilisateur a demandé à réduire les animations.
- Retirer un film affiche une notification avec « Annuler ».
- Tri des films d'une liste : ajout récent, ajout ancien, titre.
- Mobile : barre de navigation en bas, fenêtres en panneau depuis le bas de l'écran.
- Carte « Mes favoris » dans `/lists` (lecture seule) : lit `GET /api/collection?favorite=true` (Module 4) et mène vers `/collection`. Masquée tant que le Module 4 n'est pas fusionné (404).
- Hors ligne : si les listes ne peuvent pas être chargées, un message clair et un bouton « Réessayer » s'affichent (jamais une fausse liste vide).
- Accessibilité : lien « Aller au contenu », focus clavier visible, fenêtres natives `<dialog>`, libellés sur tous les boutons d'icône.

## Correctif partagé : service worker (`public/sw.js`)
Le service worker mettait en cache **toutes** les requêtes GET, y compris `/api/...`, et servait la version en cache en premier : une liste modifiée pouvait s'afficher dans son ancien état. Correctif : `/api/` n'est plus jamais mis en cache (cahier des charges : pas de données personnelles en cache), et le cache passe en `v2` pour purger les anciennes réponses.

## Données de démonstration (examen)

```bash
node scripts/seed-demo-lists.mjs --email ton@email.tn         # aperçu : n'écrit rien
node scripts/seed-demo-lists.mjs --email ton@email.tn --yes   # supprime TES listes et crée les listes de démo
```
Lancer avec `node`, pas `npm run` : sous PowerShell, npm retire les options `--email` et `--yes`.
- Ne touche qu'aux listes de l'utilisateur indiqué (la base est partagée par l'équipe).
- Films choisis dans le catalogue selon leurs genres, année et note (aucune clé TMDB nécessaire).
- 5 listes : « Mes films préférés » (publique, 6 films), « Soirées en famille » (privée, 7), « Grands classiques » (publique, 5), « Soirée romantique » (privée, 5), « À voir ce week-end » (vide, pour montrer l'état vide).
