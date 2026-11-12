// Types partagés de l'utilisateur (Module 1)

export interface UserSession {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Données affichées par le formulaire de profil (ProfileForm)
export interface ProfileUser {
  email: string;
  username: string;
}
