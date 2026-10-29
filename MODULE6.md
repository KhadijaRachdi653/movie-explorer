# Module 6 — Recommandations & Listes personnalisées (backend)

## Fichiers ajoutés
- `src/models/CustomList.ts` — modèle Mongoose (liste + films)
- `src/types/customList.ts` — types partagés (DTO, format de retour)
- `src/lib/tmdb.ts` — client TMDB (réutilisable par les autres modules)
- `src/actions/customListActions.ts` — CRUD des listes (Server Actions)
- `src/actions/recommendationActions.ts` — recommandations
- `src/app/dev/module6/page.tsx` — page de test (dev uniquement, à supprimer ensuite)
- `.env.example` — variables nécessaires

## Actions disponibles
Toutes renvoient `{ success: true, data, message? }` ou `{ success: false, error }`.

| Action | Rôle |
|---|---|
| `createList({ name, description?, isPublic? })` | Créer une liste |
| `getMyLists()` | Mes listes |
| `getListById(id)` | Une liste (si propriétaire ou publique) |
| `updateList(id, { name?, description?, isPublic? })` | Modifier |
| `deleteList(id)` | Supprimer |
| `addMovieToList(id, { tmdbId, title, posterPath? })` | Ajouter un film |
| `removeMovieFromList(id, tmdbId)` | Retirer un film |
| `getMovieRecommendations(tmdbId)` | Films similaires (page détail) |
| `getPersonalRecommendations(limit?)` | « Pour toi » basé sur mes listes |

## Règles métier
- Connexion obligatoire pour toute écriture ; on ne modifie que ses propres listes.
- Nom unique par utilisateur (insensible à la casse), 2–50 caractères.
- 20 listes max par utilisateur, 100 films max par liste, pas de doublon de film.
- Liste privée par défaut ; une liste publique est lisible par tous.
- « Pour toi » : 3 derniers films ajoutés → recommandations TMDB fusionnées (film recommandé plusieurs fois = prioritaire), films déjà en liste exclus ; sans film → tendances de la semaine.

## Exemple d'utilisation côté front (composant client)
```tsx
"use client";
import { addMovieToList } from "@/actions/customListActions";

const res = await addMovieToList(listId, { tmdbId: movie.id, title: movie.title, posterPath: movie.poster_path });
if (!res.success) alert(res.error);
```
