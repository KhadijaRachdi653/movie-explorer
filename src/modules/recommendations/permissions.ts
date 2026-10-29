import type { Visibility } from "./types";

// Règles d'accès aux listes (fonctions pures, testées unitairement)

interface ListAccessInfo {
  ownerId: string;
  visibility: Visibility;
}

/** Lecture : le propriétaire, ou tout le monde si la liste est publique. */
export function canViewList(list: ListAccessInfo, userId: string | null): boolean {
  return list.visibility === "public" || (userId !== null && list.ownerId === userId);
}

/** Modification / suppression : uniquement le propriétaire. */
export function canEditList(list: ListAccessInfo, userId: string | null): boolean {
  return userId !== null && list.ownerId === userId;
}
