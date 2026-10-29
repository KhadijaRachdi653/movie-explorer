// Page de TEST du backend Module 6 (dev uniquement) — à supprimer quand le front est prêt
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createList, getMyLists, deleteList, addMovieToList, removeMovieFromList, updateList } from "@/actions/customListActions";
import { getPersonalRecommendations } from "@/actions/recommendationActions";

export const dynamic = "force-dynamic";

export default async function Module6TestPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const lists = await getMyLists();
  const recos = await getPersonalRecommendations(5);

  async function onCreate(fd: FormData) {
    "use server";
    console.log(await createList({ name: String(fd.get("name")), isPublic: fd.get("isPublic") === "on" }));
    revalidatePath("/dev/module6");
  }
  async function onRename(fd: FormData) {
    "use server";
    console.log(await updateList(String(fd.get("id")), { name: String(fd.get("name")) }));
    revalidatePath("/dev/module6");
  }
  async function onDelete(fd: FormData) {
    "use server";
    console.log(await deleteList(String(fd.get("id"))));
    revalidatePath("/dev/module6");
  }
  async function onAddMovie(fd: FormData) {
    "use server";
    console.log(await addMovieToList(String(fd.get("id")), { tmdbId: Number(fd.get("tmdbId")), title: String(fd.get("title")) }));
    revalidatePath("/dev/module6");
  }
  async function onRemoveMovie(fd: FormData) {
    "use server";
    console.log(await removeMovieFromList(String(fd.get("id")), Number(fd.get("tmdbId"))));
    revalidatePath("/dev/module6");
  }

  return (
    <main className="p-4 space-y-6 text-sm">
      <h1 className="text-xl font-bold">Test backend Module 6</h1>

      <form action={onCreate} className="flex gap-2">
        <input name="name" placeholder="Nom de la liste" className="border p-1" required />
        <label><input type="checkbox" name="isPublic" /> publique</label>
        <button className="border px-2">Créer</button>
      </form>

      <section>
        <h2 className="font-semibold">Mes listes</h2>
        {!lists.success && <p className="text-red-600">{lists.error}</p>}
        {lists.success && lists.data.map((l) => (
          <div key={l.id} className="border p-2 my-2 space-y-1">
            <p><b>{l.name}</b> ({l.moviesCount} films, {l.isPublic ? "publique" : "privée"}) — id: {l.id}</p>
            <ul>{l.movies.map((m) => <li key={m.tmdbId}>{m.tmdbId} — {m.title}</li>)}</ul>
            <form action={onRename} className="flex gap-2"><input type="hidden" name="id" value={l.id} /><input name="name" placeholder="Nouveau nom" className="border p-1" /><button className="border px-2">Renommer</button></form>
            <form action={onAddMovie} className="flex gap-2"><input type="hidden" name="id" value={l.id} /><input name="tmdbId" placeholder="tmdbId (ex: 550)" className="border p-1" /><input name="title" placeholder="Titre" className="border p-1" /><button className="border px-2">Ajouter film</button></form>
            <form action={onRemoveMovie} className="flex gap-2"><input type="hidden" name="id" value={l.id} /><input name="tmdbId" placeholder="tmdbId" className="border p-1" /><button className="border px-2">Retirer film</button></form>
            <form action={onDelete}><input type="hidden" name="id" value={l.id} /><button className="border px-2 text-red-600">Supprimer la liste</button></form>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-semibold">Recommandations « Pour toi »</h2>
        {recos.success ? <ul>{recos.data.map((m) => <li key={m.id}>{m.id} — {m.title}</li>)}</ul> : <p className="text-red-600">{recos.error}</p>}
      </section>
    </main>
  );
}
