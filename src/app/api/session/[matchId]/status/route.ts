import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params

    // 매치 조회
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('매치 상태 조회 실패:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}