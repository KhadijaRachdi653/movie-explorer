import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400 mt-auto">
      <p>
        © {new Date().getFullYear()} Movie Explorer — tn.esprit.movieexplorer
      </p>
    </footer>
  );
}
