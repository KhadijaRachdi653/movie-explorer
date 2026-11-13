"use client";

import { createContext, useContext } from "react";
import type { CustomListDTO, Visibility } from "@/modules/recommendations/types";
import type { CardMovie } from "./movie";

export type ToastAction = { label: string; run: () => void };
export type Toast = { id: number; message: string; tone: "success" | "error"; action?: ToastAction };
export type Session = { status: "loading" | "guest" | "user"; userId: string | null; name: string | null };

export interface StreamingContextValue {
  session: Session;
  lists: CustomListDTO[];
  listsLoaded: boolean;
  listsError: string | null; // ex. pas de connexion : on ne fait pas croire que la liste est vide
  reloadLists: () => Promise<void>;
  createList: (input: { name: string; description: string; visibility: Visibility }) => Promise<CustomListDTO | null>;
  updateList: (id: string, input: { name: string; description: string; visibility: Visibility }) => Promise<CustomListDTO | null>;
  deleteList: (id: string) => Promise<boolean>;
  addMovie: (listId: string, movie: CardMovie) => Promise<boolean>;
  removeMovie: (listId: string, movie: CardMovie) => Promise<boolean>; // propose « Annuler »
  notify: (message: string, tone?: Toast["tone"], action?: ToastAction) => void;
  openAddToList: (movie: CardMovie) => void; // fenêtre « Ajouter à une liste »
  openMovie: (movie: CardMovie, listId?: string) => void; // fiche rapide du film
}

export const StreamingContext = createContext<StreamingContextValue | null>(null);

export function useStreaming() {
  const ctx = useContext(StreamingContext);
  if (!ctx) throw new Error("useStreaming doit être utilisé dans StreamingProvider");
  return ctx;
}

