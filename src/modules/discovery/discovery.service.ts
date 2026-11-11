import dbConnect from "@/lib/mongodb";
import Movie, { type MovieDoc } from "@/modules/movies/movie.model";
import type { SearchQuery } from "./discovery.schema";
import type { DiscoveryMovie, Genre, SearchResponse, SortOption } from "./discovery.types";

const PAGE_SIZE = 20;

const SORT: Record<SortOption, Record<string, 1 | -1>> = {
  popularity: { createdAt: -1 },
  rating: { rating: -1 },
  release_date: { year: -1 },
  title: { title: 1 },
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toDiscoveryMovie(m: MovieDoc): DiscoveryMovie {
  return {
    movieId: m._id.toString(),
    title: m.title,
    overview: m.overview ?? "",
    posterUrl: m.posterUrl || null,
    year: m.year ?? null,
    rating: m.rating ?? 0,
    genres: m.genres ?? [],
  };
}

function buildEmptyMessage(q: SearchQuery): string {
  if (q.query) return `Aucun film ne correspond à « ${q.query} ». Vérifiez l'orthographe ou retirez des filtres.`;
  return "Aucun film ne correspond à ces filtres. Essayez d'élargir vos critères.";
}

export async function searchMovies(q: SearchQuery): Promise<SearchResponse> {
  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (q.query) filter.title = { $regex: escapeRegex(q.query), $options: "i" };
  if (q.genre) filter.genres = q.genre;
  if (q.year) filter.year = q.year;
  if (q.minRating !== undefined) filter.rating = { $gte: q.minRating };

  const [docs, total] = await Promise.all([
    Movie.find(filter)
      .sort(SORT[q.sortBy])
      .collation({ locale: "fr" })
      .skip((q.page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean<MovieDoc[]>(),
    Movie.countDocuments(filter),
  ]);

  const results = docs.map(toDiscoveryMovie);
  const isEmpty = results.length === 0;

  return {
    results,
    page: q.page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    totalResults: total,
    isEmpty,
    emptyMessage: isEmpty ? buildEmptyMessage(q) : null,
  };
}

export async function getGenres(): Promise<Genre[]> {
  await dbConnect();
  const names: string[] = await Movie.distinct("genres");
  return names
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((name) => ({ id: name, name }));
}
