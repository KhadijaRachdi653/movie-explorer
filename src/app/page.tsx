import { auth } from "@/lib/auth";

async function getPopularMovies() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=1`,
      { next: { revalidate: 3600 } },
    );

    /*const res = await fetch(
      'https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=fr-FR&page=1',
      { next: { revalidate: 3600 } }
    );*/
    if (!res.ok) {
      console.error(`Erreur API TMDB: Statut ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Échec TMDB :", error);
    return [];
  }
}

export default async function Home() {
  const session = await auth();
  const movies = await getPopularMovies();
  const genres = ["Pour vous", "Action", "Drame", "Sci-fi"];

  const featuredMovie = movies[0] || {
    title: "DUNE : DEUXIÈME PARTIE",
    backdrop_path: "/xOMo8wZ7w3jT2vYwX6vymI6Zz7X.jpg",
    vote_average: 8.7,
    release_date: "2024",
  };

  return (
    <main className="mx-auto max-w-7xl p-6 transition-all">
      <div className="mb-6">
        <span className="text-xs font-bold tracking-widest text-[var(--accent)] uppercase">
          BONSOIR,{" "}
          {session?.user?.name ? session.user.name.split(" ")[0] : "INVITÉ"}
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-tight text-[var(--text-primary)]">
          Quel film va vous
          <br />
          faire vibrer ce soir ?
        </h1>
      </div>

      <div className="relative mb-6 max-w-xl">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 opacity-50">
          🔍
        </span>
        <input
          type="text"
          placeholder="Rechercher un film, un acteur..."
          className="w-full pl-12 pr-4 py-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl text-sm text-[var(--text-primary)] transition-colors shadow-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {genres.map((genre, idx) => (
          <button
            key={genre}
            className={`px-5 py-2 text-xs font-bold rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
              idx === 0
                ? "bg-[var(--text-primary)] text-[var(--background)] border-transparent shadow-sm"
                : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:bg-[var(--surface-variant)]"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      <div className="relative w-full h-[380px] rounded-[22px] overflow-hidden border border-[var(--border-subtle)] shadow-xl mb-8 bg-[var(--surface)]">
        {featuredMovie.backdrop_path && (
          <img
            //src={`https://tmdb.org{featuredMovie.backdrop_path}`}
            src={`https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`}
            alt="À la une"
            className="w-full h-full object-cover opacity-85"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
          <span className="text-[10px] font-extrabold text-[var(--accent-light)] tracking-widest uppercase">
            🎬 À LA UNE
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight">
            {featuredMovie.title}
          </h2>
          <div className="flex gap-2 mt-3">
            <button className="px-4 py-2 bg-white text-slate-950 font-bold rounded-xl text-xs active:scale-95 transition-transform cursor-pointer">
              ▶ Bande-annonce
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black tracking-tight">
          Choisis pour vous
        </h3>
        <button className="text-xs font-bold text-[var(--accent)] hover:underline cursor-pointer">
          Tout voir
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.slice(1, 11).map((movie: any, idx: number) => (
          <div key={movie.id} className="flex flex-col group">
            <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-md bg-[var(--surface)] transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
              <img
                //src={`https://tmdb.org{movie.poster_path}`}
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1">
                <span className="text-yellow-400 text-xs">⭐</span>
                <span className="text-white text-[10px] font-bold">
                  {movie.vote_average?.toFixed(1)}
                </span>
              </div>
              <div className="absolute left-3 bottom-1">
                <span className="text-white text-3xl font-black opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold truncate text-[var(--text-primary)] pr-2">
                {movie.title}
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {movie.release_date?.split("-")[0] || "2024"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
