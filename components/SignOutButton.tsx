"use client"

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm hover:bg-slate-100"
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      Cerrar sesión
    </button>
  )
}

