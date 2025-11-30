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
        loginToken: { label: 'Login Token', type: 'text' },
      },
      async authorize(credentials) {
        const loginToken = (credentials as any)?.loginToken as string | undefined
        if (loginToken) {
          // One-time token sign-in (used after email verification)
          const vt = await prisma.verificationToken.findFirst({
            where: { token: loginToken, identifier: { startsWith: 'verify-login:' } },
          })
          if (!vt || vt.expires < new Date()) {
            return null
          }
          const emailFromId = vt.identifier.replace('verify-login:', '')
          const user = await prisma.user.findUnique({ where: { email: emailFromId } })
          // Consume token regardless of user lookup result to avoid reuse
          await prisma.verificationToken.delete({ where: { identifier_token: { identifier: vt.identifier, token: vt.token } } }).catch(() => {})
          if (!user) return null
          return { id: user.id, name: user.name, email: user.email || undefined, image: user.image || undefined }
        }

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
    signIn: '/auth',
  },
}

// For App Router route handlers
export const auth = () => NextAuth(authOptions)
