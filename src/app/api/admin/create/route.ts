import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 보안을 위해 특정 키를 확인
    const { key } = await request.json()
    
    if (key !== 'create-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 기존 관리자 삭제
    await prisma.admin.deleteMany({})
    
    // 새 관리자 생성
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin created successfully',
      admin: { id: admin.id, username: admin.username }
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Failed to create admin' }, 
      { status: 500 }
    )
  }
}