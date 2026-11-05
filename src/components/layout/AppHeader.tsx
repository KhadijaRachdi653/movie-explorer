import { auth } from "@/lib/auth";
import Link from "next/link";
import HeaderNav from "@/components/layout/HeaderNav";

export default async function AppHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur sm:px-6">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold text-blue-500">
        🎬 Movie Explorer
      </Link>

      <HeaderNav userName={session?.user?.name ?? null} />
    </header>
  );
}
