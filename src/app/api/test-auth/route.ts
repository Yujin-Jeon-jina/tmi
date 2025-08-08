import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    console.log('🔍 Test Auth - Received credentials:', { username, passwordLength: password?.length })
    
    // 환경변수 확인
    console.log('🌍 Environment check:', {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    })
    
    // 데이터베이스 연결 테스트
    const admin = await prisma.admin.findUnique({
      where: { username }
    })
    
    console.log('👤 Admin lookup result:', admin ? { id: admin.id, username: admin.username } : 'Not found')
    
    if (!admin) {
      // 모든 관리자 나열
      const allAdmins = await prisma.admin.findMany()
      console.log('📊 All admins in database:', allAdmins.map(a => ({ id: a.id, username: a.username })))
      
      return NextResponse.json({ 
        success: false, 
        error: 'Admin not found',
        allAdmins: allAdmins.map(a => ({ id: a.id, username: a.username }))
      })
    }
    
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    console.log('🔐 Password validation result:', isPasswordValid)
    
    return NextResponse.json({ 
      success: isPasswordValid,
      admin: { id: admin.id, username: admin.username },
      passwordValid: isPasswordValid
    })
    
  } catch (error) {
    console.error('❌ Test Auth Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}