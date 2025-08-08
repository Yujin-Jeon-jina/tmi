import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development',
  debug: true, // Always enable debug in production to see what's happening
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: '사용자명', type: 'text' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Authorization attempt started')
        console.log('📋 Credentials received:', {
          username: credentials?.username,
          passwordLength: credentials?.password?.length || 0,
          hasPassword: !!credentials?.password
        })
        console.log('🌍 Environment check:', {
          hasSecret: !!process.env.NEXTAUTH_SECRET,
          nodeEnv: process.env.NODE_ENV,
          databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing'
        })
        
        if (!credentials?.username || !credentials?.password) {
          console.log('❌ Missing credentials - username or password empty')
          return null
        }

        try {
          console.log('🔍 Searching for admin:', credentials.username)
          
          const admin = await prisma.admin.findUnique({
            where: { username: credentials.username }
          })

          if (!admin) {
            console.log('❌ Admin not found in database:', credentials.username)
            
            // List all admins for debugging
            const allAdmins = await prisma.admin.findMany()
            console.log('📊 All admins in database:', allAdmins.map(a => ({ id: a.id, username: a.username })))
            return null
          }

          console.log('✅ Admin found in database:', { id: admin.id, username: admin.username })

          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password)
          console.log('🔐 Password comparison result:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', credentials.username)
            return null
          }

          console.log('✅ Authentication successful, returning user object')
          const userObject = {
            id: admin.id.toString(),
            name: admin.username,
            email: admin.username
          }
          console.log('👤 Returning user:', userObject)
          
          return userObject
        } catch (error) {
          console.error('❌ Database/Auth error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          })
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