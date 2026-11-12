# Intégration du Module 4 (Collection personnelle — Amine)

Source : `feature/personal-collection` (dernier commit `0d43dbc`, 06/11), intégré dans `style/plateforme-unifiee`.

## Ce qui ne change pas (logique d'Amine)
- Statuts `planned` / `watching` / `watched` (« À voir », « En cours », « Vu »), favori, historique de visionnage.
- Un seul élément par utilisateur et par film (index unique `{ userId, movie.movieId }`).
- Passage à « Vu » : ajout automatique d'un visionnage ; « Vu à nouveau aujourd'hui » : nouveau visionnage.
- API : `GET/POST /api/collection` (filtres `?favorite=` et `?status=`), `PATCH/DELETE /api/collection/[id]`, `POST /api/collection/[id]/viewings`.
- Page `/collection` : filtres, recherche par titre, tri, mises à jour optimistes.

## Ce qui change : adaptation au catalogue de l'équipe (Module 2)
Comme pour le Module 6, l'équipe utilise le catalogue MongoDB de Baha à la place de TMDB.

| Fichier | Avant (TMDB) | Après (catalogue) |
|---|---|---|
| `collection.types.ts`, `collection.model.ts` | `movieId: number`, `genreIds: number[]` | `movieId: string` (identifiant du catalogue), `genres: string[]` |
| `collection.schema.ts` | `z.number()` | identifiant MongoDB valide (`isValidObjectId`), genres en texte |
| `src/app/collection/page.tsx` | `AppHeader` | en-tête commun (`SiteHeader`) |
| `src/app/collection/CollectionView.tsx` | — | présentation au thème de la plateforme (logique identique) ; chaque affiche mène à `/movies/[id]` |

## Ajouter un film à la collection
Les boutons étaient dans l'ancienne page Découvrir (remplacée par celle d'Olfa). Ils sont maintenant sur la **fiche d'un film** (`src/components/collection/CollectionActions.tsx`) : « Ajouter aux favoris » et « À voir / En cours / Vu », via **l'API du Module 4**.

## Liens avec les autres modules
- Module 6 : les favoris servent de signal aux recommandations et la carte « Mes favoris » s'affiche dans `/lists`.
- Les éléments de test créés avant (avec un `movieId` TMDB numérique) restent lisibles mais ne correspondent à aucun film du catalogue : les retirer depuis `/collection`.
