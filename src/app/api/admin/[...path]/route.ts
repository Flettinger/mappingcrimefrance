import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://mappingcrimefrance.onrender.com";
const cookieName = "mcf_admin_session";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/admin",
} as const;

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  const path = (await context.params).path.join("/");
  const method = request.method;
  const headers = { "Cache-Control": "no-store" };
  const fail = (status: number) => NextResponse.json({ error: "Administration indisponible" }, { status, headers });

  if (method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) {
    return fail(403);
  }

  try {
    if (path === "session" && method === "DELETE") {
      const response = new NextResponse(null, { status: 204, headers });
      response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
      return response;
    }
    if (path === "session" && method === "POST") {
      const credentials = await request.json();
      if (typeof credentials?.username !== "string" || typeof credentials.password !== "string"
          || credentials.username.length > 100 || credentials.password.length > 256) {
        return fail(400);
      }
      const upstream = await fetch(`${apiUrl}/admin/session`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        cache: "no-store",
        redirect: "error",
      });
      if (!upstream.ok) return fail(upstream.status);
      const { session, max_age } = await upstream.json();
      if (typeof session !== "string" || !Number.isInteger(max_age) || max_age <= 0) return fail(502);
      const response = new NextResponse(null, { status: 204, headers });
      response.cookies.set(cookieName, session, { ...cookieOptions, maxAge: max_age });
      return response;
    }

    const allowed =
      (method === "GET" && (path === "incidents/all" || path === "subscribers")) ||
      (method === "PUT" && /^(incidents\/\d+\/(approve|reject)|subscribers\/\d+\/confirm)$/.test(path)) ||
      (method === "DELETE" && /^(incidents|subscribers)\/\d+$/.test(path));
    if (!allowed) return fail(404);

    const session = request.cookies.get(cookieName)?.value;
    if (!session) return fail(401);
    const upstream = await fetch(`${apiUrl}/admin/${path}`, {
      method,
      headers: { "x-admin-session": session },
      cache: "no-store",
      redirect: "error",
    });
    if (!upstream.ok) return fail(upstream.status);
    return NextResponse.json(await upstream.json(), { headers });
  } catch {
    return fail(502);
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
