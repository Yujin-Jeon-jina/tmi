import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json()
    
    if (!matchId) {
      return NextResponse.json({ error: 'matchId가 필요합니다' }, { status: 400 })
    }
    
    // 매치 찾기
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })
    
    if (!match) {
      return NextResponse.json({ error: '매치를 찾을 수 없습니다' }, { status: 404 })
    }
    
    // pdfUrl 초기화
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { pdfUrl: null }
    })
    
    return NextResponse.json({
      message: 'PDF URL이 초기화되었습니다',
      matchId: updatedMatch.id,
      previousPdfUrl: match.pdfUrl,
      newPdfUrl: updatedMatch.pdfUrl
    })
    
  } catch (error: any) {
    console.error('PDF URL 초기화 실패:', error)
    return NextResponse.json({ 
      error: `초기화 실패: ${error?.message || error}` 
    }, { status: 500 })
  }
}