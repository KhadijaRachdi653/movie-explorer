import AppHeader from "@/components/layout/AppHeader";
import CollectionView from "./CollectionView";

export default function CollectionPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppHeader />
      <CollectionView />
    </div>
  );
}
