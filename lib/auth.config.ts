import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma/bcrypt here) so it can be shared with middleware,
// which runs before the Node-only `authorize` callback in lib/auth.ts is needed.
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname.startsWith("/login");

      if (isLoginPage) {
        return isLoggedIn ? Response.redirect(new URL("/", request.nextUrl)) : true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
