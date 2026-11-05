import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isPrivatePage = ["/profile", "/collection", "/favorites", "/watchlist"].some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isPrivatePage && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/profile/:path*", "/collection/:path*", "/watchlist/:path*", "/favorites/:path*"],
};
