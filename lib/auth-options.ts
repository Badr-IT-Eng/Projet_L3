import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { JWT } from "next-auth/jwt"
import bcrypt from "bcryptjs"

// Add custom types to extend NextAuth types
declare module "next-auth" {
  interface User {
    id: string
    role?: string
  }
  
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
  }
}

// Mock user database for development
const MOCK_USERS = [
  {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    password: bcrypt.hashSync("password123", 10),
    role: "user"
  },
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin"
  }
];

// This is a simplified version of the auth options with mock functionality
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // For development, use mock user database
          const user = MOCK_USERS.find(u => u.email === credentials.email);
          
          if (!user) {
            console.log("User not found");
            return null;
          }
          
          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.log("Invalid password");
            return null;
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: null
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  // This is a development secret and should be replaced in production
  secret: process.env.NEXTAUTH_SECRET || "ThisIsATemporarySecretForDevelopmentOnly",
  debug: process.env.NODE_ENV === "development",
} 