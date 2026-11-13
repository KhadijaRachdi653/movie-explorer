import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError, DATABASE_UNAVAILABLE, toErrorResponse } from "@/modules/recommendations/errors";

async function check(err: unknown) {
  const res = toErrorResponse(err, "test");
  return { status: res.status, body: (await res.json()) as { error: string } };
}

describe("toErrorResponse", () => {
  it("garde le code et le message d'une erreur métier", async () => {
    expect(await check(new ApiError(409, "Ce film est déjà dans la liste."))).toEqual({ status: 409, body: { error: "Ce film est déjà dans la liste." } });
  });
  it("renvoie 400 pour une donnée invalide", async () => {
    const parsed = z.object({ name: z.string().min(2, "Trop court.") }).safeParse({ name: "a" });
    expect((await check(parsed.error)).status).toBe(400);
  });
  it("renvoie 409 pour un doublon MongoDB", async () => {
    expect((await check({ code: 11000 })).status).toBe(409);
  });
  it("renvoie 503 et un message clair quand MongoDB est injoignable", async () => {
    const err = Object.assign(new Error("connect ETIMEDOUT"), { name: "MongooseServerSelectionError" });
    expect(await check(err)).toEqual({ status: 503, body: { error: DATABASE_UNAVAILABLE } });
  });
  it("renvoie 500 pour une erreur inconnue, sans détail interne", async () => {
    expect(await check(new Error("secret interne"))).toEqual({ status: 500, body: { error: "Erreur interne du serveur." } });
  });
});
