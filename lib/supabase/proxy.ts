
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session and retrieve authenticated user claims.
  const { data, error } = await supabase.auth.getClaims();

const claims = error ? null : data?.claims ?? null;

  const pathname = request.nextUrl.pathname;

  // Pages that require authentication.
  const protectedRoutes = [
    "/dashboard",
    "/progress",
    "/food-history",
    "/profile",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );

  // Pages that authenticated users should not revisit.
  const authRoutes = ["/login", "/signup"];

  const isAuthRoute = authRoutes.includes(pathname);
  const isAuthenticated = Boolean(claims);

  // Redirect unauthenticated users to login.
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);

    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/signup.
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  return supabaseResponse;
}
