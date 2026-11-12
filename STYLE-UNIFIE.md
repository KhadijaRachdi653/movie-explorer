# Style unifié de la plateforme (branche `style/plateforme-unifiee`)

Base : `feature/zina-reviews-and-cinebot`. **Aucune logique modifiée** : actions, API, services et modèles sont intacts. Certaines pages ont une **nouvelle présentation (JSX)**, avec exactement les mêmes données et fonctions qu'avant.

## Ce qui change

| Fichier | Changement |
|---|---|
| `src/app/globals.css` | Couleurs Tailwind redéfinies : `slate` = bleu nuit, `blue` = or. Variables `--background`, `--accent`… du mode sombre alignées. Police Bricolage Grotesque. Contour de focus visible au clavier (avant : supprimé partout, problème d'accessibilité). Boutons or avec texte foncé. |
| `src/app/layout.tsx` | Chargement de la police, en-tête commun `<SiteHeader />`, couleur de barre du navigateur. |
| `src/components/layout/SiteHeader.tsx` | **Nouveau** : en-tête commun (Accueil, Films, Découvrir, Pour vous, Mes listes, Admin pour les administrateurs, profil, déconnexion ; menu déroulant sur mobile). |
| `src/app/(streaming)/layout.tsx` | Le Module 6 utilise l'en-tête commun. |
| `src/components/recommendations/Header.tsx` | Supprimé (remplacé par l'en-tête commun). |
| `src/components/recommendations/StreamingProvider.tsx` | Notifications en bas d'écran (plus de barre de navigation en bas). |

## Lot 1 — pages refaites (présentation uniquement)

| Fichier | Logique conservée à l'identique | Nouvelle présentation |
|---|---|---|
| `src/app/page.tsx` (accueil) | `auth()`, rôle admin | La page charge les données (`listMovies(1, 60)`, Module 2) et les passe à `HomeView`. La déconnexion se fait depuis l'en-tête commun (le bouton en double est retiré). |
| `src/components/home/HomeView.tsx` | — | **Nouveau** : mur d'affiches animé, mosaïque « À la une », « Explorer par genre », « Sorties récentes » (cartes horizontales, par année), bandeau final. Volontairement différent de « Pour vous » (pas de Top 10 ni de rangées). |
| `src/components/home/GenreExplorer.tsx` | — | **Nouveau** : boutons de genre qui changent la grille d'affiches |
| `src/app/movies/page.tsx` | `listMovies(page, 12)`, pagination, lien admin | Titre, grille d'affiches, pagination en pastilles |
| `src/app/movies/[id]/page.tsx` | `isValidMovieId`, `getMovie`, `getRatingSummary`, `MovieReviewsSection` | Bannière avec affiche floutée, genres en étiquettes, boutons d'action ; section des avis en pleine largeur |
| `src/components/movies/MovieCard.tsx` | même lien `/movies/[id]` | Carte d'affiche animée au survol |

## Lot 2 — pages refaites (présentation uniquement)

| Fichier | Logique conservée à l'identique | Nouvelle présentation |
|---|---|---|
| `src/app/(auth)/layout.tsx` | — | Écran partagé : mur d'affiches du catalogue (`listMovies`) + formulaire |
| `src/components/auth/LoginForm.tsx` | `verifyUserCredentials`, redirection, messages | Carte de connexion, libellés et `autocomplete` |
| `src/components/auth/RegisterForm.tsx` | `registerUser`, redirection vers `/login` | Carte d'inscription, rappel de la règle du mot de passe |
| `src/app/(auth)/forgot-password` et `reset-password` | formulaires inchangés | Conteneur retiré (le layout s'en charge) |
| `src/app/profile/page.tsx` | session, `updateProfile`, `deleteAccount`, `getAllUsers` (admin) | En-tête avec avatar, carte « Informations », accès rapides, zone de suppression, tableau admin |
| `src/app/discover/page.tsx` | recherche, filtres, pagination, hors ligne, CRUD des recherches sauvegardées | Grand titre, barre de recherche, grille d'affiches, panneau des recherches. En-tête propre remplacé par l'en-tête commun |
| `src/components/chatbot/ChatBotClient.tsx` | envoi, suggestions, réinitialisation | Fenêtre et bouton au thème cinéma |
| `src/components/auth/authStyles.ts` | — | **Nouveau** : classes communes des formulaires |

## Correctif : service worker
`public/sw.js` ligne 104 : `vibrate:,` (erreur de syntaxe) → `vibrate: [100, 50, 100],`. Le navigateur refusait tout le service worker : plus de mode hors ligne. **Erreur présente aussi sur `feature/zina-reviews-and-cinebot`.**

## Pourquoi les autres pages changent sans être modifiées
Elles utilisent les classes Tailwind `bg-slate-*`, `text-blue-*`… Ces couleurs sont redéfinies **une seule fois** dans `globals.css` : chaque page garde exactement son code.

## Pages qui gardent leur propre en-tête
`/movies/[id]/reviews` et `/offline` : l'en-tête commun y est masqué pour éviter un doublon (leurs en-têtes sont simplement recolorés).

## À savoir
- `npm run build` échoue déjà sur `feature/zina-reviews-and-cinebot` (erreurs TypeScript dans `src/actions/userActions.ts`, `src/components/auth/ProfileForm.tsx`, `src/lib/mongodb.ts`), indépendamment de ce style. `npm run dev` fonctionne.
