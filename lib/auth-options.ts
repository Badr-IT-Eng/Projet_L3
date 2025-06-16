import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { JWT } from "next-auth/jwt"

// Add custom types to extend NextAuth types
declare module "next-auth" {
  interface User {
    id: string
    role?: string
    accessToken?: string
  }
  
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
    accessToken?: string
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const response = await fetch("http://localhost:8082/api/auth/signin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          
          return {
            id: data.id.toString(),
            name: data.username,
            email: data.email,
            role: data.roles[0], // Assuming the first role is the primary role
            accessToken: data.token // Add the JWT token to the user object
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/register",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.accessToken = user.accessToken // Store the JWT token in the JWT
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.accessToken = token.accessToken // Add the JWT token to the session
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "ThisIsATemporarySecretForDevelopmentOnly",
  debug: process.env.NODE_ENV === "development",
} 