import { type NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.sobesso.ru";
const ALLOWED_PREFIXES = ["auth/", "api/"];
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function proxyHandler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const isAllowed = ALLOWED_PREFIXES.some((p) => pathStr.startsWith(p));
  if (!isAllowed) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (MUTATING_METHODS.has(req.method)) {
    const csrfHeader = req.headers.get("x-csrf-token");
    const csrfCookie = req.cookies.get("csrfToken")?.value;
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      return NextResponse.json({ message: "CSRF token mismatch" }, { status: 403 });
    }
  }

  const url = new URL(req.url);
  const targetUrl = `${API_BASE}/${pathStr}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("cookie");
  headers.set("origin", API_BASE);
  headers.set("referer", `${API_BASE}/`);

  const cookie = req.headers.get("x-forwarded-cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.text()
      : undefined;

  try {
    const resp = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    const respHeaders = new Headers();
    resp.headers.forEach((value, key) => {
      const lk = key.toLowerCase();
      if (lk === "set-cookie") {
        const rewritten = value
          .replace(/Domain=[^;]+;?/gi, "")
          .replace(/Secure;?/gi, "")
          .replace(/SameSite=[^;]+;?/gi, "SameSite=Lax");
        respHeaders.append("set-cookie", rewritten);
      } else if (
        lk !== "transfer-encoding" &&
        lk !== "content-encoding" &&
        lk !== "content-length"
      ) {
        respHeaders.set(key, value);
      }
    });

    if (resp.status >= 300 && resp.status < 400) {
      const location = resp.headers.get("location");
      if (location) {
        respHeaders.set("location", location);
      }
    }

    const respBody = await resp.text();
    return new NextResponse(respBody, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    });
  } catch {
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;
export const OPTIONS = proxyHandler;
