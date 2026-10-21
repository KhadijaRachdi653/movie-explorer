import Link from "next/link";

export const metadata = {
  title: "Hors ligne",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl p-8 text-center">
      <h1 className="text-3xl font-bold">Vous êtes hors ligne</h1>

      <p className="mt-4 text-slate-300">
        Movie Explorer ne peut pas charger les nouvelles données. Les pages déjà
        consultées peuvent rester disponibles grâce au cache.
      </p>

      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2 font-semibold"
      >
        Réessayer
      </Link>
    </div>
  );
}