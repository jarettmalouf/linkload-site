import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const GATE_COOKIE_NAME = "linkload_access";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/gate", "/api/gate", "/apply-cofounder", "/api/apply-cofounder"];

// Check if path starts with any public route
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

// Check if path is a static asset or Next.js internal route
function isAssetOrInternal(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and internal routes
  if (isAssetOrInternal(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for valid gate cookie
  const token = request.cookies.get(GATE_COOKIE_NAME);

  if (!token) {
    // Redirect to gate page
    return NextResponse.redirect(new URL("/gate", request.url));
  }

  try {
    // Decode and validate token
    const decoded = JSON.parse(Buffer.from(token.value, "base64").toString());

    // Check if token is expired
    if (decoded.exp < Date.now()) {
      // Token expired, redirect to gate
      const response = NextResponse.redirect(new URL("/gate", request.url));
      response.cookies.delete(GATE_COOKIE_NAME);
      return response;
    }

    // Token valid, allow access
    return NextResponse.next();
  } catch {
    // Invalid token, redirect to gate
    const response = NextResponse.redirect(new URL("/gate", request.url));
    response.cookies.delete(GATE_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
