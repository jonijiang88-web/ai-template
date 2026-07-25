import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        name: { label: '用户名' },
      },
      authorize(c) {
        const name = c.name
        if (typeof name !== 'string' || !name.trim()) return null
        return { name, email: `${name}@demo.local` }
      },
    }),
  ],
})
