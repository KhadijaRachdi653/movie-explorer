"use server";

import dbConnect from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import CustomList from "@/models/CustomList";
import { tmdbFetch, type TmdbMovie, type TmdbPage } from "@/lib/tmdb";
import type { ModuleResult } from "@/types/customList";

const SEED_COUNT = 3; // nb de films récents utilisés comme base

// ---------- Films similaires à un film (page détail) ----------
export async function getMovieRecommendations(tmdbId: number, page = 1): Promise<ModuleResult<TmdbMovie[]>> {
  try {
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) return { success: false, error: "Identifiant TMDB invalide." };
    const data = await tmdbFetch<TmdbPage<TmdbMovie>>(`/movie/${tmdbId}/recommendations`, { page });
    return { success: true, data: data.results };
  } catch (err) {
    console.error("Erreur recommandations film :", err);
    return { success: false, error: "Impossible de charger les recommandations." };
  }
}

// ---------- "Pour toi" : basé sur les films des listes de l'utilisateur ----------
// Logique métier :
// 1. on prend les 3 derniers films ajoutés dans ses listes
// 2. on récupère les recommandations TMDB de chacun
// 3. on fusionne : un film recommandé plusieurs fois remonte en tête
// 4. on exclut les films déjà présents dans ses listes
// 5. si aucune liste/film -> repli sur les tendances de la semaine
export async function getPersonalRecommendations(limit = 20): Promise<ModuleResult<TmdbMovie[]>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    let alreadyInLists = new Set<number>();
    let seeds: number[] = [];

    if (userId) {
      await dbConnect();
      const lists = await CustomList.find({ user: userId }, "movies").lean();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const movies = lists.flatMap((l: any) => l.movies ?? []);
      alreadyInLists = new Set(movies.map((m: { tmdbId: number }) => m.tmdbId));
      seeds = movies
        .sort((a: { addedAt: Date }, b: { addedAt: Date }) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .map((m: { tmdbId: number }) => m.tmdbId)
        .filter((id: number, i: number, arr: number[]) => arr.indexOf(id) === i)
        .slice(0, SEED_COUNT);
    }

    if (seeds.length === 0) {
      const trending = await tmdbFetch<TmdbPage<TmdbMovie>>("/trending/movie/week");
      return { success: true, data: trending.results.slice(0, limit) };
    }

    const pages = await Promise.all(
      seeds.map((id) =>
        tmdbFetch<TmdbPage<TmdbMovie>>(`/movie/${id}/recommendations`).catch(() => null)
      )
    );

    const scores = new Map<number, { movie: TmdbMovie; score: number }>();
    for (const p of pages) {
      for (const movie of p?.results ?? []) {
        if (alreadyInLists.has(movie.id)) continue;
        const entry = scores.get(movie.id);
        if (entry) entry.score += 1;
        else scores.set(movie.id, { movie, score: 1 });
      }
    }

    const result = [...scores.values()]
      .sort((a, b) => b.score - a.score || b.movie.vote_average - a.movie.vote_average)
      .slice(0, limit)
      .map((e) => e.movie);

    return { success: true, data: result };
  } catch (err) {
    console.error("Erreur recommandations perso :", err);
    return { success: false, error: "Impossible de charger les recommandations." };
  }
}
