import Link from "next/link";
import { btnPrimary } from "./ui";

export default function SignInPrompt({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-3 text-[var(--mist)]">{text}</p>
      <Link href="/login" className={`${btnPrimary} mt-6`}>
        Se connecter
      </Link>
    </div>
  );
}
