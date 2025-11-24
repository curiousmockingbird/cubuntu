// auth.ts

import NextAuth from "next-auth";
import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

export const authConfig: NextAuthOptions = {
  // This lets you control where the login page lives

  pages: {
    signIn: "/login",
  },

  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "database", // uses Session model
  },

  providers: [
    Credentials({
      // This is the login form structure

      credentials: {
        identifier: { label: "Email or username", type: "text" },

        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        // Find by email or username

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },

              { username: credentials.identifier },
            ],
          },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        // Anything returned here ends up in session.user

        return {
          id: user.id,

          name: user.name,

          email: user.email,

          username: user.username,
        };
      },
    }),
  ],

  callbacks: {
    // expose id / username on the session.user object

    async session({
      session,
      user,
      token,
    }: {
      session: Session;
      user?: any;
      token?: JWT | null;
    }) {
      // if using database strategy, `user` is defined; if JWT, you’d use token

      // if using database strategy, `user` is defined; if JWT, you’d use token

      if (session.user) {
        if (user) {
          (session.user as any).id = user.id;

          (session.user as any).username = (user as any).username ?? null;
        } else if (token) {
          // fallback for JWT strategy if you change later

          (session.user as any).id = token?.sub ?? null;
        }
      }

      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
