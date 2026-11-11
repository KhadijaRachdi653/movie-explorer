import type { Metadata } from "next";
import RecommendationsView from "@/components/recommendations/RecommendationsView";

export const metadata: Metadata = { title: "Pour vous" };

export default function RecommendationsPage() {
  return <RecommendationsView />;
}
