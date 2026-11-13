"use client";

import type { ComponentProps } from "react";
import type { RecommendationsResponse } from "@/modules/recommendations/types";
import MovieRow from "./MovieRow";
import { fromRecommended } from "./movie";
import { useApiData } from "./useApiData";

// Rangée « recommandé pour la liste X » (GET /api/recommendations?listId=)
export default function ListRecoRow({
  listId,
  title,
  quickAction,
}: {
  listId: string;
  title: string;
  quickAction?: ComponentProps<typeof MovieRow>["quickAction"];
}) {
  const { data, loading } = useApiData<RecommendationsResponse>(`/api/recommendations?listId=${listId}&limit=18`);
  // Une liste vide renvoie les tendances : on ne les présente pas comme « pour cette liste »
  if (!loading && data?.source !== "list") return null;
  return <MovieRow title={title} movies={data?.results.map(fromRecommended) ?? []} loading={loading} quickAction={quickAction} />;
}
