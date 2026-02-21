import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>,
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auto-promote admins from ADMIN_EMAILS env var
  if (user && user.email) {
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    if (adminEmailsEnv) {
      const adminEmails = adminEmailsEnv
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0);

      if (adminEmails.includes(user.email.toLowerCase())) {
        // Create service client for admin promotion
        const serviceSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SECRET_KEY!,
          {
            cookies: {
              getAll() {
                return [];
              },
              setAll() {},
            },
          },
        );

        // Check and promote if needed
        const { data: profile, error: profileError } = await serviceSupabase
          .from("user_profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .single();

        console.log("[Admin Promotion] Profile:", profile);
        console.log("[Admin Promotion] Profile error:", profileError);

        if (profile && !profile.is_admin) {
          console.log("[Admin Promotion] Promoting user to admin...");
          const { error: updateError } = await serviceSupabase
            .from("user_profiles")
            .update({ is_admin: true })
            .eq("user_id", user.id);

          if (updateError) {
            console.error(
              "[Admin Promotion] ❌ Failed to promote:",
              updateError,
            );
          } else {
            console.log(
              "[Admin Promotion] ✅ Successfully promoted to admin!",
              user.id,
            );
          }
        } else if (profile?.is_admin) {
          console.log("[Admin Promotion] User is already admin", user.id);
        }
      }
    }
  }

  // Protected routes (require authentication)
  const protectedPaths = ["/dashboard", "/admin"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Check approval status and admin access for protected routes
  if (user && isProtectedPath) {
    // Create service client to bypass RLS
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      },
    );

    const { data: profile } = await serviceSupabase
      .from("user_profiles")
      .select("status, is_admin")
      .eq("user_id", user.id)
      .single();

    // Check admin access for /admin/* paths
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!profile?.is_admin) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    // Check approval status for dashboard
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      // Only block suspended users (no longer checking pending status)
      if (profile?.status === "suspended") {
        const url = request.nextUrl.clone();
        url.pathname = "/suspended";
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ["/login", "/signup"];
  const isAuthPath = authPaths.some(
    (path) => request.nextUrl.pathname === path,
  );

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
