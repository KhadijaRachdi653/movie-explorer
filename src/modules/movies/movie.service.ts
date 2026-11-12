import dbConnect from "@/lib/mongodb";
import { ApiError } from "@/modules/discovery/http";
import Movie, { type MovieDoc } from "./movie.model";
import type { MovieInput, UpdateMovieInput } from "./movie.schema";

export function toMovie(doc: MovieDoc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    overview: doc.overview ?? "",
    posterUrl: doc.posterUrl ?? "",
    year: doc.year ?? 0,
    genres: doc.genres ?? [],
    director: doc.director ?? "",
    rating: doc.rating ?? 0,
  };
}

export type MovieDto = ReturnType<typeof toMovie>;

export async function listMovies(page: number, limit: number) {
  await dbConnect();
  const [docs, total] = await Promise.all([
    Movie.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<MovieDoc[]>(),
    Movie.countDocuments(),
  ]);
  return {
    movies: docs.map(toMovie),
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
}

export async function getMovie(id: string) {
  await dbConnect();
  const doc = await Movie.findById(id).lean<MovieDoc>();
  if (!doc) throw new ApiError(404, "Film introuvable.");
  return toMovie(doc);
}

export async function createMovie(input: MovieInput) {
  await dbConnect();
  const doc = await Movie.create(input);
  return toMovie(doc.toObject());
}

export async function updateMovie(id: string, input: UpdateMovieInput) {
  await dbConnect();
  const doc = await Movie.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  }).lean<MovieDoc>();
  if (!doc) throw new ApiError(404, "Film introuvable.");
  return toMovie(doc);
}

export async function deleteMovie(id: string) {
  await dbConnect();
  const doc = await Movie.findByIdAndDelete(id);
  if (!doc) throw new ApiError(404, "Film introuvable.");
}
