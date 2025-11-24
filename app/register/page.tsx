import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import prisma from '../../lib/prisma'
import bcrypt from 'bcryptjs'

export const metadata: Metadata = {
  title: 'Create account',
}

async function createUser(formData: FormData) {
  'use server'
  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').toLowerCase().trim()
  const password = String(formData.get('password') || '')

  if (!email || !password) throw new Error('Email and password are required.')
  if (password.length < 8) throw new Error('Password must be at least 8 characters.')

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) throw new Error('Email already in use.')

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { email, name: name || null, passwordHash } })

  redirect('/login')
}

export default function RegisterPage() {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">Create account</h2>
      <form action={createUser} className="space-y-3 max-w-sm">
        <div>
          <label className="block text-sm mb-1" htmlFor="name">Name</label>
          <input id="name" name="name" className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required className="w-full rounded border px-3 py-2" />
        </div>
        <button className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white" type="submit">Create account</button>
      </form>
    </section>
  )
}
