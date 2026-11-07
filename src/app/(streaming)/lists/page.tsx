import type { Metadata } from "next";
import ListsView from "@/components/recommendations/ListsView";

export const metadata: Metadata = { title: "Mes listes" };

export default function ListsPage() {
  return <ListsView />;
}
