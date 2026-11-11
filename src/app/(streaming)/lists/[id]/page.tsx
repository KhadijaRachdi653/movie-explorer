import type { Metadata } from "next";
import ListDetailView from "@/components/recommendations/ListDetailView";

export const metadata: Metadata = { title: "Liste" };

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListDetailView id={id} />;
}
