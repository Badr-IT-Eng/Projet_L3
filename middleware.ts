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

        // Allow access to public routes
        if (
          pathname.startsWith("/auth") ||
          pathname.startsWith("/admin/login") ||
          pathname === "/" ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/items") ||
          pathname.startsWith("/api/search")
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
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
} 