# Mettre Movie Explorer en ligne (Vercel)

Vercel (offre gratuite « Hobby ») héberge les applications Next.js, fournit le HTTPS (indispensable pour la PWA) et redéploie automatiquement à chaque `git push`.

## 1. Prérequis
- `npm run build` doit passer (corrigé : 5 erreurs TypeScript dans `userActions.ts`, `ProfileForm.tsx` / `src/types/user.ts`, `mongodb.ts`).
- **MongoDB Atlas** (compte de Baha) : *Network Access* → *Allow access from anywhere* (`0.0.0.0/0`). Les serveurs de Vercel n'ont pas d'adresse IP fixe.

## 2. Importer le projet
Le dépôt appartient à Khadija : **c'est elle qui doit l'importer** (Vercel s'installe sur le compte GitHub propriétaire du dépôt).
1. https://vercel.com → *Sign up with GitHub*.
2. *Add New… → Project* → importer `movie-explorer`.
3. *Framework* : Next.js (détecté automatiquement). Ne rien changer aux commandes.

Variante sans Khadija : faire un *fork* du dépôt sur son propre compte GitHub et importer le fork.

## 3. Variables d'environnement (Settings → Environment Variables)
Recopier **toutes les lignes de `.env.local`**, puis adapter les adresses :

| Variable | Valeur |
|---|---|
| `MONGODB_URI` | comme dans `.env.local` |
| `AUTH_SECRET` | comme dans `.env.local` |
| `NEXTAUTH_URL` | `https://<nom-du-projet>.vercel.app` (liens des e-mails d'activation et de mot de passe) |
| `AUTH_URL` | même adresse que `NEXTAUTH_URL` |
| `AUTH_TRUST_HOST` | `true` |
| `MAIL_USER`, `MAIL_PASS` | comme dans `.env.local` (e-mails) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | comme dans `.env.local` (notifications push) |
| clé Gemini (ex. `GOOGLE_GENERATIVE_AI_API_KEY`), `CHAT_MODELS` | comme dans `.env.local` (CineBot) |
| `TMDB_API_KEY` | si présente dans `.env.local` |

Ne jamais mettre ces valeurs dans le code ni sur GitHub.

## 4. Choisir la branche publiée
*Settings → Git → Production Branch* : `style/plateforme-unifiee` (ou `main` après la fusion). Puis *Deployments → Redeploy*.

## 5. Vérifier
- Ouvrir `https://<nom-du-projet>.vercel.app` : accueil, connexion, catalogue, CineBot.
- PWA : icône d'installation dans la barre d'adresse ; mode hors ligne (F12 → Network → Offline).
- En cas d'erreur : *Deployments* → le déploiement → *Logs*.

## 6. Données de démonstration
Le script s'exécute depuis un ordinateur (il écrit directement dans MongoDB Atlas, la même base que le site en ligne) :
`node scripts/seed-demo-lists.mjs --email ton@email.tn --yes`
