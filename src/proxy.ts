import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProfilePage = req.nextUrl.pathname.startsWith("/profile");

  if (isProfilePage && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/profile/:path*", "/watchlist/:path*", "/favorites/:path*"],
};
