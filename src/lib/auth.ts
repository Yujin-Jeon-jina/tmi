import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: '사용자명', type: 'text' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Authorization attempt:', { username: credentials?.username })
        
        if (!credentials?.username || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const admin = await prisma.admin.findUnique({
            where: { username: credentials.username }
          })

          if (!admin) {
            console.log('❌ Admin not found:', credentials.username)
            return null
          }

          console.log('✅ Admin found:', { id: admin.id, username: admin.username })

          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password)

          if (!isPasswordValid) {
            console.log('❌ Invalid password for:', credentials.username)
            return null
          }

          console.log('✅ Password valid, logging in:', admin.username)
          return {
            id: admin.id.toString(),
            name: admin.username,
            email: admin.username
          }
        } catch (error) {
          console.error('❌ Database error during auth:', error)
          return null
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
      if (token && session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    }
  }
}