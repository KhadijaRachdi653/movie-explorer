import { tool } from "ai";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Movie, { type MovieDoc } from "@/modules/movies/movie.model";
import { getRatingSummaries, getRatingSummary, getTopRatedMovieIds, listReviews } from "@/modules/reviews/review.service";

// Outils de lecture seule : CineBot consulte le catalogue (Module 2) et les avis (Module 3), il ne modifie rien

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function withCommunityRatings(movies: MovieDoc[]) {
  const ratings = await getRatingSummaries(movies.map((m) => m._id.toString()));
  return movies.map((m) => {
    const id = m._id.toString();
    return {
      movieId: id,
      title: m.title,
      year: m.year,
      genres: m.genres,
      director: m.director,
      link: `/movies/${id}`,
      communityRating: ratings[id] ?? { average: 0, count: 0 },
    };
  });
}

export const cinebotTools = {
  searchCatalogue: tool({
    description:
      "Cherche des films dans le catalogue de l'application, par mot-clé (titre, réalisateur, synopsis), genre ou année. Sans critère, renvoie les derniers films ajoutés.",
    inputSchema: z.object({
      keyword: z.string().max(100).optional().describe("Mot-clé : titre, réalisateur ou thème"),
      genre: z.string().max(50).optional().describe("Genre, ex. Action, Drame, Science-Fiction"),
      year: z.number().int().optional(),
      limit: z.number().int().min(1).max(10).default(5),
    }),
    execute: async ({ keyword, genre, year, limit }) => {
      await dbConnect();
      const filter: Record<string, unknown> = {};
      if (keyword) {
        const rx = { $regex: escapeRegex(keyword), $options: "i" };
        filter.$or = [{ title: rx }, { director: rx }, { overview: rx }];
      }
      if (genre) filter.genres = { $regex: `^${escapeRegex(genre)}$`, $options: "i" };
      if (year) filter.year = year;
      const movies = await Movie.find(filter).sort({ createdAt: -1 }).limit(limit).lean<MovieDoc[]>();
      if (!movies.length) return { count: 0, movies: [], note: "Aucun film du catalogue ne correspond à ces critères." };
      return { count: movies.length, movies: await withCommunityRatings(movies) };
    },
  }),

  getMovieDetails: tool({
    description:
      "Donne la fiche d'un film du catalogue (synopsis, réalisateur, genres), la note de la communauté et les avis les plus aimés.",
    inputSchema: z.object({ movieId: z.string().describe("Identifiant du film, obtenu via searchCatalogue") }),
    execute: async ({ movieId }) => {
      if (!isValidObjectId(movieId)) return { error: "Identifiant invalide : utilisez searchCatalogue d'abord." };
      await dbConnect();
      const movie = await Movie.findById(movieId).lean<MovieDoc>();
      if (!movie) return { error: "Film introuvable dans le catalogue." };
      const [summary, { reviews }] = await Promise.all([
        getRatingSummary(movieId),
        listReviews({ movieId, sort: "likes", page: 1, limit: 3 }),
      ]);
      return {
        movieId,
        title: movie.title,
        year: movie.year,
        director: movie.director,
        genres: movie.genres,
        overview: movie.overview,
        link: `/movies/${movieId}`,
        reviewsLink: `/movies/${movieId}/reviews`,
        communityRating: { average: summary.average, count: summary.count },
        topReviews: reviews.map((r) => ({
          author: r.author.name,
          stars: r.score,
          likes: r.likeCount,
          // Les spoilers ne sont jamais transmis au modèle
          content: r.spoiler ? "[contient des spoilers — non affiché]" : r.content,
        })),
      };
    },
  }),

  topRatedByCommunity: tool({
    description: "Liste les films les mieux notés par les utilisateurs de l'application.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(10).default(5) }),
    execute: async ({ limit }) => {
      const top = await getTopRatedMovieIds(limit);
      if (!top.length) return { movies: [], note: "Aucun film n'a encore été noté par la communauté." };
      await dbConnect();
      const movies = await Movie.find({ _id: { $in: top.map((t) => t._id) } }).lean<MovieDoc[]>();
      const byId = new Map(movies.map((m) => [m._id.toString(), m]));
      return {
        movies: top
          .filter((t) => byId.has(t._id))
          .map((t) => ({
            movieId: t._id,
            title: byId.get(t._id)!.title,
            link: `/movies/${t._id}`,
            average: Math.round(t.average * 10) / 10,
            votes: t.count,
          })),
      };
    },
  }),
};
