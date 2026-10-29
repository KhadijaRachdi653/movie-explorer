// Page de démonstration du Module 6 (dev uniquement) — appelle la vraie API /api/lists et /api/recommendations
import { notFound } from "next/navigation";
import Module6Demo from "./Module6Demo";

export default function Module6DemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Module6Demo />;
}
