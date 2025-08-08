import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 모든 매치 조회
    const matches = await prisma.match.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('매치 리스트 조회 실패:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { teacherName, teacherPhone, studentName, studentPhone } = body

    // 입력 검증
    if (!teacherName || !teacherPhone || !studentName || !studentPhone) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }

    // 매치 생성
    const match = await prisma.match.create({
      data: {
        teacherName,
        teacherPhone,
        studentName,
        studentPhone,
        status: 'waiting'
      }
    })

    return NextResponse.json({ 
      match,
      message: '매치가 성공적으로 생성되었습니다.'
    })
  } catch (error) {
    console.error('매치 생성 실패:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}