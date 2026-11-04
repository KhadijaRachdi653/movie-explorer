import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import ProfileForm from "@/components/auth/ProfileForm";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Mon Profil | Movie Explorer",
};

export default async function ProfilePage() {
  // 1. 🔒 Cloisonnement de session : Rejet si non connecté
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  // 2. Extraction du profil de la base Cloud Atlas
  const dbUser = await User.findById(session.user.id).lean();

  if (!dbUser) {
    redirect("/login");
  }

  // 3. 💡 ALIGNEMENT CRITIQUE : Transmettre exact 'username' attendu par ProfileForm.tsx
  const userData = {
    email: dbUser.email,
    username: dbUser.name || "", // Mappe la propriété 'name' de la BD sur l'input 'username'
    avatar: dbUser.avatar || "",
  };

  const isAdmin = dbUser.role === "admin";

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 text-white" style={{ fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#38bdf8" }}>Gestion de mon compte</h1>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: "0.25rem" }}>
            Espace membre — Rôle : <span style={{ fontWeight: "bold", color: isAdmin ? "#f43f5e" : "#10b981" }}>{dbUser.role?.toUpperCase() || "USER"}</span>
          </p>
        </div>

        {isAdmin && (
          <Link
            href="/admin/users"
            style={{ padding: "0.75rem 1.25rem", backgroundColor: "#f43f5e", color: "white", textDecoration: "none", borderRadius: "0.5rem", fontWeight: "bold", fontSize: "0.875rem" }}
          >
            🛡️ Tableau de bord Admin
          </Link>
        )}
      </div>

      {/* Rendu graphique sans plantage de propriétés */}
      <ProfileForm user={userData} />
    </div>
  );
}
