# Intégration du Module 1 (Utilisateurs — Khadija) depuis `main` (commit `2e0c218`, 12/11)

La version de `main` a été comparée à la branche unifiée **après normalisation de la mise en forme** (Prettier) : seuls les vrais changements ont été repris. La présentation reste celle de la plateforme unifiée.

## Repris de Khadija
| Fonctionnalité | Fichiers |
|---|---|
| Inscription par `/api/auth/register` avec **e-mail d'activation** (Mailtrap), puis redirection vers `/login?registered=true` | `src/components/auth/RegisterForm.tsx` |
| Messages « inscription réussie » et « compte activé » (`?registered=true`, `?activated=true` envoyé par `/api/auth/activate`) | `src/components/auth/LoginForm.tsx`, `src/app/(auth)/login/page.tsx` |
| Profil lu côté serveur + `ProfileForm` : informations, **accès Premium** (`toggleSubscription`, notifications aux administrateurs), **changement de mot de passe** (`changePassword`) | `src/app/profile/page.tsx`, `src/components/auth/ProfileForm.tsx` |
| Lien « Espace administration » vers `/admin/users` | `src/app/profile/page.tsx` |
| Page « Mes notes et avis » (sa version) | `src/app/profile/ratings/page.tsx` |
| Vérifications « utilisateur introuvable » / abonnement push incomplet | `src/actions/userActions.ts` |

## Ajouté pour ne rien perdre
- `src/app/api/auth/register/route.ts` : la **règle du mot de passe** (6 à 10 caractères, majuscule, chiffre, caractère spécial) est vérifiée côté serveur, comme dans `authActions.ts` (l'ancienne inscription la vérifiait ; la route ne le faisait pas).
- `src/components/auth/DeleteAccountCard.tsx` : la **suppression du compte** (action `deleteAccount` existante) reste disponible dans le profil.

## Non repris (sans effet ou remplacé)
- Reformatage Prettier des autres fichiers (aucun changement de logique).
- `layout.tsx` (Navbar, Footer, nom « CINEA ») et `manifest.ts` : la plateforme garde l'en-tête commun, le nom « Movie Explorer » et ses couleurs.
- Pages d'administration des utilisateurs : seulement reformatées sur `main`, déjà identiques.

## Prérequis
`.env.local` : `MAIL_USER` et `MAIL_PASS` (Mailtrap) pour l'e-mail d'activation et le mot de passe oublié. La connexion n'exige pas que le compte soit activé.

## À savoir
L'« accès Premium » du profil (Khadija, champ `isSubscribed`) et les **abonnements** Basique / Premium / Ultime (Baha, `/subscriptions`) sont deux mécanismes différents : à harmoniser en équipe si besoin.
