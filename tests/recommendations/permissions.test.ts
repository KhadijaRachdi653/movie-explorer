import { describe, expect, it } from "vitest";
import { canEditList, canViewList } from "@/modules/recommendations/permissions";

const OWNER = "owner-id";
const OTHER = "other-id";
const privateList = { ownerId: OWNER, visibility: "private" as const };
const publicList = { ownerId: OWNER, visibility: "public" as const };

describe("canViewList", () => {
  it("le propriétaire voit sa liste privée", () => expect(canViewList(privateList, OWNER)).toBe(true));
  it("un autre utilisateur ne voit pas une liste privée", () => expect(canViewList(privateList, OTHER)).toBe(false));
  it("un visiteur non connecté ne voit pas une liste privée", () => expect(canViewList(privateList, null)).toBe(false));
  it("tout le monde voit une liste publique", () => {
    expect(canViewList(publicList, OTHER)).toBe(true);
    expect(canViewList(publicList, null)).toBe(true);
  });
});

describe("canEditList", () => {
  it("le propriétaire peut modifier", () => expect(canEditList(privateList, OWNER)).toBe(true));
  it("un autre utilisateur ne peut pas modifier, même une liste publique", () => expect(canEditList(publicList, OTHER)).toBe(false));
  it("un visiteur non connecté ne peut pas modifier", () => expect(canEditList(publicList, null)).toBe(false));
});
