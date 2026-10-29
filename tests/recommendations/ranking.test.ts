import { describe, expect, it } from "vitest";
import { buildSignals, rankCandidates, SEED_COUNT, type CandidateGroup } from "@/modules/recommendations/ranking";
import type { TmdbMovie } from "@/lib/tmdb";

const movie = (id: number, genre_ids: number[] = [], vote_average = 5): TmdbMovie => ({
  id, title: `Film ${id}`, overview: "", poster_path: null, backdrop_path: null, release_date: "2020-01-01", vote_average, genre_ids,
});

describe("buildSignals", () => {
  const userMovies = [
    { movieId: 1, title: "Ancien", genreIds: [18], addedAt: "2026-01-01" },
    { movieId: 2, title: "Récent", genreIds: [28, 18], addedAt: "2026-03-01" },
    { movieId: 3, title: "Moyen", genreIds: [28], addedAt: "2026-02-01" },
    { movieId: 4, title: "Plus ancien", genreIds: [35], addedAt: "2025-01-01" },
    { movieId: 2, title: "Récent", genreIds: [28, 18], addedAt: "2026-03-02" }, // même film dans 2 listes
  ];

  it("prend les films les plus récents comme points de départ, sans doublon", () => {
    const s = buildSignals(userMovies);
    expect(s.seeds.map((x) => x.movieId)).toEqual([2, 3, 1]);
    expect(s.seeds.length).toBeLessThanOrEqual(SEED_COUNT);
  });
  it("classe les genres par fréquence", () => {
    expect(buildSignals(userMovies).topGenres).toEqual([18, 28, 35]);
  });
  it("exclut tous les films déjà connus", () => {
    expect([...buildSignals(userMovies).excludeIds].sort()).toEqual([1, 2, 3, 4]);
  });
  it("aucun film → aucun signal", () => {
    const s = buildSignals([]);
    expect(s.seeds).toEqual([]);
    expect(s.topGenres).toEqual([]);
  });
});

describe("rankCandidates", () => {
  const signals = { seeds: [], topGenres: [28], excludeIds: new Set([99]) };

  it("place en tête un film recommandé par plusieurs films de départ", () => {
    const groups: CandidateGroup[] = [
      { seedTitle: "A", movies: [movie(10), movie(11)] },
      { seedTitle: "B", movies: [movie(11), movie(12)] },
    ];
    expect(rankCandidates(groups, signals, 10)[0].movieId).toBe(11);
  });
  it("favorise les films des genres préférés", () => {
    const groups: CandidateGroup[] = [{ seedTitle: "A", movies: [movie(10, [35]), movie(11, [28])] }];
    expect(rankCandidates(groups, signals, 10)[0].movieId).toBe(11);
  });
  it("départage par la note TMDB", () => {
    const groups: CandidateGroup[] = [{ seedTitle: "A", movies: [movie(10, [], 6), movie(11, [], 8)] }];
    expect(rankCandidates(groups, signals, 10).map((m) => m.movieId)).toEqual([11, 10]);
  });
  it("exclut les films déjà connus et respecte la limite", () => {
    const groups: CandidateGroup[] = [{ seedTitle: "A", movies: [movie(99), movie(1), movie(2), movie(3)] }];
    const result = rankCandidates(groups, signals, 2);
    expect(result).toHaveLength(2);
    expect(result.some((m) => m.movieId === 99)).toBe(false);
  });
  it("explique la recommandation", () => {
    const groups: CandidateGroup[] = [
      { seedTitle: "Fight Club", movies: [movie(10)] },
      { seedTitle: null, movies: [movie(20, [28])] },
    ];
    const result = rankCandidates(groups, signals, 10);
    expect(result.find((m) => m.movieId === 10)?.reason).toBe("Parce que vous avez ajouté Fight Club");
    expect(result.find((m) => m.movieId === 20)?.reason).toBe("Dans vos genres préférés");
  });
});
