# Module 2 — Gestion des abonnements (Baha)

CRUD des abonnements utilisateurs, **à but pédagogique** : les offres et le paiement sont simulés,
ils ne débloquent ni ne restreignent aucune fonctionnalité de la plateforme.
Le champ existant `User.isSubscribed` et l'action `toggleSubscription` (Module 1) ne sont pas modifiés.

## Fichiers
- `src/modules/subscriptions/subscription.constants.ts` — offres du catalogue (Basique / Premium / Ultime), statuts, périodes, libellés (importable côté client)
- `src/modules/subscriptions/subscription.model.ts` — modèle Mongoose `Subscription` (collection `subscriptions`)
- `src/modules/subscriptions/subscription.schema.ts` — validation zod (souscription, changement d'offre, création / modification admin, filtres)
- `src/modules/subscriptions/subscription.service.ts` — logique métier CRUD, statuts calculés, statistiques
- `src/modules/subscriptions/http.ts` — utilisateur connecté obligatoire, lecture de l'identifiant
- `src/app/api/subscriptions/route.ts` — `GET` (liste, recherche, filtres) / `POST` (création)
- `src/app/api/subscriptions/[id]/route.ts` — `GET` / `PATCH` / `DELETE`
- `src/app/subscriptions/page.tsx` — « Mon abonnement » : offre actuelle, grille des offres, paiement simulé, historique
- `src/app/subscriptions/[id]/page.tsx` — détail d'un abonnement (frise des dates)
- `src/app/admin/subscriptions/page.tsx` — tableau de bord et gestion administrateur
- `src/components/subscriptions/*` — composants d'interface
- `scripts/seed-subscriptions.mjs` — données de démonstration

Réutilisé sans modification : `lib/mongodb.ts`, `lib/auth.ts`, `ApiError` / `toErrorResponse` / `readJson` (`modules/discovery/http.ts`), `getViewer` (`modules/reviews/http.ts`), `reviewsApi` (`components/reviews/api.ts`).
Seule modification d'un fichier existant : deux liens dans l'en-tête de `src/app/page.tsx`.

## Modèle `Subscription`
| Champ | Type | Règle |
|---|---|---|
| `userId` | ObjectId → `User` | obligatoire |
| `planName` | texte | obligatoire, 2–50 caractères |
| `description` | texte | facultatif, 300 max |
| `price` | nombre | obligatoire, ≥ 0 |
| `billingPeriod` | `monthly` \| `yearly` | obligatoire |
| `startDate` | date | obligatoire (aujourd'hui par défaut) |
| `endDate` | date \| null | facultatif, postérieure à `startDate` |
| `status` | `active` \| `pending` \| `expired` \| `cancelled` | obligatoire |
| `createdAt`, `updatedAt` | date | timestamps Mongoose |

Index : `{ userId, status }`, `{ status, endDate }`, `{ createdAt }`.

## Règles métier
- Un seul abonnement **actif ou en attente** par utilisateur (409 sinon).
- Statuts recalculés à chaque lecture (pas de tâche planifiée) : fin passée → `expired` ; début atteint → `pending` devient `active`.
- Utilisateur : le prix vient du catalogue (jamais du client). Changer d'offre remplace l'offre en cours, la nouvelle période démarre aujourd'hui. Résilier → `cancelled`.
- Utilisateur : supprimer n'est possible que pour un abonnement terminé (expiré ou résilié).
- Administrateur : création pour n'importe quel utilisateur (par e-mail), modification libre de tous les champs, suppression de n'importe quel abonnement.
- Paiement simulé : les champs de carte ne sont vérifiés que sur leur format, dans le navigateur, et **ne sont jamais envoyés au serveur**.

## API
Toutes les routes exigent une session (401 sinon). Erreurs : `{ "error": "..." }`.

| Méthode | Route | Qui | Corps / paramètres |
|---|---|---|---|
| GET | `/api/subscriptions` | connecté | `q`, `status`, `billingPeriod`, `planName`, `sort` (`recent`, `oldest`, `price-desc`, `price-asc`, `end-soon`), `page`, `limit`, `scope` (`mine` par défaut, `all` = admin) |
| POST | `/api/subscriptions` | utilisateur | `{ planName, billingPeriod }` |
| POST | `/api/subscriptions` | admin | `{ userEmail, planName, description?, price, billingPeriod, startDate, endDate?, status }` |
| GET | `/api/subscriptions/[id]` | propriétaire ou admin | — |
| PATCH | `/api/subscriptions/[id]` | propriétaire | `{ action: "change-plan", planName, billingPeriod }` ou `{ action: "cancel" }` |
| PATCH | `/api/subscriptions/[id]` | admin | champs partiels : `planName`, `description`, `price`, `billingPeriod`, `startDate`, `endDate`, `status` |
| DELETE | `/api/subscriptions/[id]` | propriétaire (terminé) ou admin | — |

Codes : `200` / `201`, `400` validation, `401` non connecté, `403` réservé admin, `404` introuvable (ou appartenant à un autre utilisateur), `409` abonnement déjà en cours.

## Données de démonstration
```bash
node --env-file=.env.local scripts/seed-reviews.mjs          # comptes @demo.cinea (Module 3), si absents
node --env-file=.env.local scripts/seed-subscriptions.mjs    # abonnements de démo
node --env-file=.env.local scripts/seed-subscriptions.mjs --remove
```
