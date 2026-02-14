// Import middleware function from shared platform (middleware-specific export)
import { middleware } from "@web3web4/shared-platform/middleware-exports";

// Export the middleware function
export { middleware };

// Config must be defined locally (not re-exported)
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
