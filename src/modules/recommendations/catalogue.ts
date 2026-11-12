import { isValidObjectId, type Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Movie from "@/modules/movies/movie.model";
import { getRatingSummaries } from "@/modules/reviews/review.service";

// Le catalogue (Module 2) est la seule source des films du Module 6 ; la note des spectateurs vient du Module 3

export const MIN_COMMUNITY_VOTES = 3; // en dessous, la note du catalogue est utilisée

export interface CatalogMovie {
  movieId: string;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  year: number | null;
  genres: string[];
  director: string;
  rating: number; // sur 10 : moyenne des spectateurs (/5 × 2) si assez de votes, sinon note du catalogue
  communityVotes: number;
}

interface MovieRow {
  _id: Types.ObjectId;
  title: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string | null; // champ ajouté par l'import TMDB, absent des fiches saisies à la main
  year?: number;
  genres?: string[];
  director?: string;
  rating?: number;
}

/** Films du catalogue (tous, ou ceux des identifiants donnés), du plus récent au plus ancien. */
export async function getCatalogMovies(
  ids?: string[],
): Promise<CatalogMovie[]> {
  await dbConnect();
  const filter = ids
    ? { _id: { $in: ids.filter((id) => isValidObjectId(id)) } }
    : {};
  const docs = await Movie.find(filter)
    .sort({ createdAt: -1 })
    .lean<MovieRow[]>();
  const community = await getRatingSummaries(docs.map((d) => d._id.toString()));
  return docs.map((d) => {
    const movieId = d._id.toString();
    const votes = community[movieId]?.count ?? 0;
    return {
      movieId,
      title: d.title,
      overview: d.overview ?? "",
      posterUrl: d.posterUrl || null,
      backdropUrl: d.backdropUrl || null,
      year: d.year || null,
      genres: d.genres ?? [],
      director: d.director ?? "",
      rating:
        votes >= MIN_COMMUNITY_VOTES
          ? community[movieId].average * 2
          : (d.rating ?? 0),
      communityVotes: votes,
    };
  });
}

export async function getCatalogMap(
  ids: string[],
): Promise<Map<string, CatalogMovie>> {
  return new Map((await getCatalogMovies(ids)).map((m) => [m.movieId, m]));
}
