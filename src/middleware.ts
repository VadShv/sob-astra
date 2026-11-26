import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "sobessoSession";
const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/invite/") || pathname.startsWith("/jobs");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(AUTH_COOKIE)?.value;

  if (isPublicPath(pathname)) {
    if (session && PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!proxy|_next|favicon|images|api).*)"],
};
