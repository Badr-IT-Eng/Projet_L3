import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Redirect admin login to normal login
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (!token || token.role !== "ROLE_ADMIN") {
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    // User dashboard protection
    if (pathname.startsWith("/dashboard")) {
      if (!token) {
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to public routes and static assets
        if (
          pathname.startsWith("/auth") ||
          pathname.startsWith("/admin/login") ||
          pathname === "/" ||
          pathname === "/lost-items" ||
          pathname === "/search" ||
          pathname === "/map" ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/items") ||
          pathname.startsWith("/api/lost-objects") ||
          pathname.startsWith("/api/search") ||
          pathname.startsWith("/api/detection") ||
          pathname.startsWith("/api/matching") ||
          pathname.startsWith("/api/upload") ||
          pathname.startsWith("/public/") ||
          pathname.includes(".") || // Static files with extensions
          pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|webp|css|js|mp4|txt|json)$/)
        ) {
          return true
        }

        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon\\.ico).*)',
  ],
} 