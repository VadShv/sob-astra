import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "sobessoSession";
const CSRF_COOKIE = "csrfToken";
const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/portal/") ||
    pathname.startsWith("/interview/") ||
    pathname.startsWith("/offer/") ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/questionnaire/")
  );
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(AUTH_COOKIE)?.value;

  const response = isPublicPath(pathname)
    ? (session && PUBLIC_PATHS.includes(pathname)
        ? NextResponse.redirect(new URL("/home", request.url))
        : NextResponse.next())
    : (!session
        ? NextResponse.redirect(new URL("/login", request.url))
        : NextResponse.next());

  if (!request.cookies.get(CSRF_COOKIE)?.value) {
    response.cookies.set(CSRF_COOKIE, generateToken(), {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!proxy|_next|favicon|images|api).*)"],
};
