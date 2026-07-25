'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function NavBar() {
  const { data: session } = useSession()

  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/" className="font-semibold">Hello Next.js</Link>
      <div className="flex items-center gap-4">
        <Link href="/chat" className="text-sm text-zinc-600 hover:text-zinc-900">ChatBox</Link>
        {session?.user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">{session.user.name}</span>
            <button onClick={() => signOut()} className="text-sm text-zinc-500 hover:text-zinc-900">
              退出
            </button>
          </div>
        ) : (
          <button onClick={() => signIn()} className="text-sm text-blue-600 hover:text-blue-800">
            登录
          </button>
        )}
      </div>
    </nav>
  )
}
