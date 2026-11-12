import { describe, expect, it } from "vitest";
import { buildSignals, rankCandidates, SEED_COUNT, similarTo, toMatchPercent, type CandidateGroup } from "@/modules/recommendations/ranking";
import type { CatalogMovie } from "@/modules/recommendations/catalogue";

const movie = (id: string, genres: string[] = [], rating = 5, director = ""): CatalogMovie => ({
  movieId: id, title: `Film ${id}`, overview: "", posterUrl: null, backdropUrl: null, year: 2020, genres, director, rating, communityVotes: 0,
});

describe("buildSignals", () => {
  const userMovies = [
    { movieId: "m1", title: "Ancien", genres: ["Drame"], director: "", addedAt: "2026-01-01" },
    { movieId: "m2", title: "Récent", genres: ["Action", "Drame"], director: "", addedAt: "2026-03-01" },
    { movieId: "m3", title: "Moyen", genres: ["Action"], director: "", addedAt: "2026-02-01" },
    { movieId: "m4", title: "Plus ancien", genres: ["Comédie"], director: "", addedAt: "2025-01-01" },
    { movieId: "m2", title: "Récent", genres: ["Action", "Drame"], director: "", addedAt: "2026-03-02" }, // même film dans 2 listes
  ];

  it("prend les films les plus récents comme points de départ, sans doublon", () => {
    const s = buildSignals(userMovies);
    expect(s.seeds.map((x) => x.movieId)).toEqual(["m2", "m3", "m1"]);
    expect(s.seeds.length).toBeLessThanOrEqual(SEED_COUNT);
  });
  it("classe les genres par fréquence", () => {
    expect(buildSignals(userMovies).topGenres).toEqual(["Action", "Drame", "Comédie"]);
  });
  it("exclut tous les films déjà connus", () => {
    expect([...buildSignals(userMovies).excludeIds].sort()).toEqual(["m1", "m2", "m3", "m4"]);
  });
  it("aucun film → aucun signal", () => {
    const s = buildSignals([]);
    expect(s.seeds).toEqual([]);
    expect(s.topGenres).toEqual([]);
  });
});

describe("similarTo", () => {
  const seed = { movieId: "s", genres: ["Drame"], director: "Christopher Nolan" };
  const catalogue = [
    movie("s", ["Drame"], 8, "Christopher Nolan"),
    movie("même-réalisateur", ["Science-Fiction"], 8, "Christopher Nolan"),
    movie("même-genre", ["Drame", "Crime"], 8, "Francis Ford Coppola"),
    movie("sans-rapport", ["Animation"], 8, "Hayao Miyazaki"),
  ];
  it("garde les films du même réalisateur ou d'un genre commun, sans le film lui-même", () => {
    expect(similarTo(seed, catalogue).map((m) => m.movieId)).toEqual(["même-réalisateur", "même-genre"]);
  });
});

describe("rankCandidates", () => {
  const signals = { seeds: [], topGenres: ["Action"], excludeIds: new Set(["m99"]) };

  it("place en tête un film proche de plusieurs films de départ", () => {
    const groups: CandidateGroup[] = [
      { seedTitle: "A", movies: [movie("m10"), movie("m11")] },
      { seedTitle: "B", movies: [movie("m11"), movie("m12")] },
    ];
    expect(rankCandidates(groups, signals, 10)[0].movieId).toBe("m11");
  });
  it("favorise les films des genres préférés", () => {
    const groups: CandidateGroup[] = [{ seedTitle: "A", movies: [movie("m10", ["Comédie"]), movie("m11", ["Action"])] }];
    expect(rankCandidates(groups, signals, 10)[0].movieId).toBe("m11");
  });
  it("départage par la note", () => {
    const groups: CandidateGroup[] = [{ seedTitle: "A", movies: [movie("m10", [], 6), movie("m11", [], 8)] }];
    expect(rankCandidates(groups, signals, 10).map((m) => m.movieId)).toEqual(["m11", "m10"]);
  });
  it("exclut les films déjà connus et respecte la limite", () => {
    const groups: CandidateGroup[] = [{ seedTitle: "A", movies: [movie("m99"), movie("m1"), movie("m2"), movie("m3")] }];
    const result = rankCandidates(groups, signals, 2);
    expect(result).toHaveLength(2);
    expect(result.some((m) => m.movieId === "m99")).toBe(false);
  });
  it("explique la recommandation", () => {
    const groups: CandidateGroup[] = [
      { seedTitle: "Fight Club", movies: [movie("m10")] },
      { seedTitle: null, movies: [movie("m20", ["Action"])] },
    ];
    const result = rankCandidates(groups, signals, 10);
    expect(result.find((m) => m.movieId === "m10")?.reason).toBe("Parce que vous avez ajouté Fight Club");
    expect(result.find((m) => m.movieId === "m20")?.reason).toBe("Dans vos genres préférés");
  });
});

describe("toMatchPercent", () => {
  const seed = (id: string) => ({ movieId: id, title: id, genres: [], director: "" });
  const signals = { seeds: [seed("a"), seed("b")], topGenres: ["Drame", "Action"] };

  it("reste entre 55 et 99 %", () => {
    expect(toMatchPercent(0, signals)).toBe(55);
    expect(toMatchPercent(1000, signals)).toBe(99);
  });
  it("augmente avec le score", () => {
    expect(toMatchPercent(5, signals)).toBeGreaterThan(toMatchPercent(2, signals));
  });
  it("un film proche de tous les films de départ, dans tous les genres préférés et noté 10 vaut 99 %", () => {
    expect(toMatchPercent(2 * 2 + 2 + 1, signals)).toBe(99);
  });
  it("est renvoyé avec chaque recommandation personnalisée", () => {
    const groups: CandidateGroup[] = [{ seedTitle: "A", movies: [movie("m10", ["Drame"], 8)] }];
    const [m] = rankCandidates(groups, { ...signals, excludeIds: new Set() }, 5);
    expect(m.match).toBeGreaterThanOrEqual(55);
    expect(m.match).toBeLessThanOrEqual(99);
  });
});

describe("notes (Module 3)", () => {
  it("exclut les films déjà notés sans en faire des signaux", () => {
    const s = buildSignals([{ movieId: "m1", title: "A", genres: ["Drame"], director: "", addedAt: "2026-01-01" }], ["m50", "m51"]);
    expect(s.seeds.map((x) => x.movieId)).toEqual(["m1"]);
    expect(s.excludeIds.has("m50")).toBe(true);
    expect(s.excludeIds.has("m51")).toBe(true);
  });
  it("un film bien noté (titre vide) donne la raison « D'après les films que vous avez bien notés »", () => {
    const signals = { seeds: [], topGenres: [], excludeIds: new Set<string>() };
    const [m] = rankCandidates([{ seedTitle: "", movies: [movie("m10")] }], signals, 5);
    expect(m.reason).toBe("D’après les films que vous avez bien notés");
  });
  it("un film venant d'un film de départ garde cette raison même s'il était déjà proposé par genre", () => {
    const signals = { seeds: [], topGenres: [], excludeIds: new Set<string>() };
    const [m] = rankCandidates([{ seedTitle: null, movies: [movie("m10")] }, { seedTitle: "Fight Club", movies: [movie("m10")] }], signals, 5);
    expect(m.reason).toBe("Parce que vous avez ajouté Fight Club");
  });
});
