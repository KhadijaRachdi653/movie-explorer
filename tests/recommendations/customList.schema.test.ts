import { describe, expect, it } from "vitest";
import { addMovieSchema, createListSchema, movieIdParamSchema, recommendationsQuerySchema, updateListSchema } from "@/modules/recommendations/customList.schema";

describe("createListSchema", () => {
  it("applique les valeurs par défaut", () => {
    expect(createListSchema.parse({ name: "  Mes films  " })).toEqual({ name: "Mes films", description: "", visibility: "private" });
  });
  it("refuse un nom trop court ou trop long", () => {
    expect(createListSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(createListSchema.safeParse({ name: "x".repeat(51) }).success).toBe(false);
  });
  it("refuse une visibilité inconnue", () => {
    expect(createListSchema.safeParse({ name: "Ok", visibility: "friends" }).success).toBe(false);
  });
});

describe("updateListSchema", () => {
  it("accepte une modification partielle", () => expect(updateListSchema.safeParse({ visibility: "public" }).success).toBe(true));
  it("refuse un corps vide", () => expect(updateListSchema.safeParse({}).success).toBe(false));
});

describe("addMovieSchema", () => {
  it("accepte un film valide", () => {
    expect(addMovieSchema.parse({ movieId: 550, title: "Fight Club" })).toEqual({ movieId: 550, title: "Fight Club", posterPath: null, genreIds: [] });
  });
  it("refuse un movieId invalide", () => {
    expect(addMovieSchema.safeParse({ movieId: -1, title: "X" }).success).toBe(false);
    expect(addMovieSchema.safeParse({ movieId: "550", title: "X" }).success).toBe(false);
  });
  it("refuse un titre vide", () => expect(addMovieSchema.safeParse({ movieId: 550, title: "  " }).success).toBe(false));
});

describe("paramètres d'URL", () => {
  it("convertit movieId en nombre", () => expect(movieIdParamSchema.parse("550")).toBe(550));
  it("refuse movieId non numérique", () => expect(movieIdParamSchema.safeParse("abc").success).toBe(false));
  it("limit par défaut = 20, max 40", () => {
    expect(recommendationsQuerySchema.parse({}).limit).toBe(20);
    expect(recommendationsQuerySchema.safeParse({ limit: "41" }).success).toBe(false);
  });
});

describe("recommendationsQuerySchema — listId", () => {
  it("accepte un identifiant de liste valide", () => {
    expect(recommendationsQuerySchema.parse({ listId: "6ae3d0c8e9a17dc42f5b4362" }).listId).toBe("6ae3d0c8e9a17dc42f5b4362");
  });
  it("refuse un identifiant de liste invalide", () => {
    expect(recommendationsQuerySchema.safeParse({ listId: "1400940" }).success).toBe(false);
  });
  it("listId vide = absent", () => {
    expect(recommendationsQuerySchema.parse({ listId: "" }).listId).toBeUndefined();
  });
});

describe("recommandations par liste", () => {
  it("accepte un listId MongoDB valide", () => {
    expect(recommendationsQuerySchema.parse({ listId: "6ae482289836dfa17311ac4f" }).listId).toBe("6ae482289836dfa17311ac4f");
  });
  it("refuse un listId invalide (ex. un ID TMDB)", () => {
    expect(recommendationsQuerySchema.safeParse({ listId: "1400940" }).success).toBe(false);
  });
});
