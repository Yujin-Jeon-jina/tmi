import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: '사용자명', type: 'text' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const admin = await prisma.admin.findUnique({
          where: { username: credentials.username }
        })

        if (!admin) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, admin.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: admin.id.toString(),
          name: admin.username,
          email: admin.username
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/admin/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}