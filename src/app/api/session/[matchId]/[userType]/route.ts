import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string; userType: string }> }
) {
  try {
    const { matchId, userType } = await params

    // userType 검증
    if (userType !== 'teacher' && userType !== 'student') {
      return NextResponse.json({ error: '잘못된 사용자 타입입니다.' }, { status: 400 })
    }

    // 매치 조회
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 사용자 타입에 따라 적절한 질문들 조회 (카테고리별 3개씩 총 15개)
    const questions: any[] = [];
    
    if (userType === 'teacher') {
      // 선생님이 답변할 질문들 (학생→선생님 질문) - 카테고리별 3개씩
      const categories = await prisma.category.findMany({
        where: { role: 'teacher' },
        orderBy: { id: 'asc' }
      });

      for (const category of categories) {
        const categoryQuestions = await prisma.teachersQuestion.findMany({
          where: { 
            categoryId: category.id,
            isActive: true 
          },
          include: { category: true },
          orderBy: { id: 'asc' },
          take: 3 // 카테고리별 3개씩만
        });
        questions.push(...categoryQuestions);
      }
    } else {
      // 학생이 답변할 질문들 (선생님→학생 질문) - 카테고리별 3개씩
      const categories = await prisma.category.findMany({
        where: { role: 'student' },
        orderBy: { id: 'asc' }
      });

      for (const category of categories) {
        const categoryQuestions = await prisma.studentsQuestion.findMany({
          where: { 
            categoryId: category.id,
            isActive: true 
          },
          include: { category: true },
          orderBy: { id: 'asc' },
          take: 3 // 카테고리별 3개씩만
        });
        questions.push(...categoryQuestions);
      }
    }

    // 기존 답변 조회
    const existingAnswers = await prisma.answer.findMany({
      where: {
        matchId,
        userType
      },
      include: {
        teachersQuestion: true,
        studentsQuestion: true
      }
    })

    return NextResponse.json({
      match,
      questions,
      existingAnswers
    })
  } catch (error) {
    console.error('세션 데이터 조회 실패:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}