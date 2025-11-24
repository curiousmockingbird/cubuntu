import NextAuth, { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  secret: process.env.AUTH_SECRET,
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
  ],
  pages: {
    signIn: '/login',
  },
}

// For App Router route handlers
export const auth = () => NextAuth(authOptions)

