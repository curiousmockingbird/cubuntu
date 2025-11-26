import NextAuth, { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Credentials sign-in requires JWT sessions in NextAuth v4
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim()
        const password = credentials?.password || ''
        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        return { id: user.id, name: user.name, email: user.email || undefined, image: user.image || undefined }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist id on the token for session mapping
        // @ts-ignore - token is a generic map
        token.id = (user as any).id
      }
      return token
    },
    async session({ session, token }) {
      // @ts-ignore - we augment session in next-auth.d.ts
      session.user = session.user || ({} as any)
      // @ts-ignore
      session.user.id = (token as any).id || token.sub || ''
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

// For App Router route handlers
export const auth = () => NextAuth(authOptions)
