import Link from "next/link";

export const metadata = {
  title: "Hors ligne",
};

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#020617",
        color: "#f8fafc",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <section
        style={{
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "560px",
          padding: "32px",
          border: "1px solid #1e293b",
          borderRadius: "20px",
          background: "#0f172a",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          Movie Explorer
        </p>
        <h1 style={{ margin: "16px 0 0", fontSize: "clamp(28px, 6vw, 40px)", lineHeight: 1.15 }}>
          Vous êtes hors ligne
        </h1>
        <p style={{ margin: "16px 0 0", color: "#cbd5e1", fontSize: "16px", lineHeight: 1.6 }}>
          Movie Explorer ne peut pas charger de nouvelles données. Les recherches
          déjà consultées peuvent rester disponibles grâce au cache.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: "24px",
            padding: "12px 20px",
            borderRadius: "10px",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Réessayer
        </Link>
      </section>
    </main>
  );
}
