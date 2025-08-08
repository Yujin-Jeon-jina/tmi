import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string; userType: string }> }
) {
  try {
    const { matchId, userType } = await params
    const body = await request.json()
    const { answers } = body

    // userType 검증
    if (userType !== 'teacher' && userType !== 'student') {
      return NextResponse.json({ error: '잘못된 사용자 타입입니다.' }, { status: 400 })
    }

    // 매치 존재 확인
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 기존 답변 삭제 (재제출 대응)
    await prisma.answer.deleteMany({
      where: {
        matchId,
        userType
      }
    })

    // 새 답변 저장 (새로운 구조에 맞게)
    const answerData = answers.map((answer: { questionId: number; content: string }) => {
      if (userType === 'teacher') {
        // 선생님 답변 (teachersQuestionId 사용)
        return {
          matchId,
          teachersQuestionId: answer.questionId,
          studentsQuestionId: null,
          userType,
          content: answer.content
        }
      } else {
        // 학생 답변 (studentsQuestionId 사용)
        return {
          matchId,
          teachersQuestionId: null,
          studentsQuestionId: answer.questionId,
          userType,
          content: answer.content
        }
      }
    })

    await prisma.answer.createMany({
      data: answerData
    })

    // 매치 상태 업데이트
    let newStatus = match.status
    if (userType === 'teacher') {
      if (match.status === 'waiting') {
        newStatus = 'teacher_completed'
      } else if (match.status === 'student_completed') {
        newStatus = 'both_completed'
      }
    } else {
      if (match.status === 'waiting') {
        newStatus = 'student_completed'
      } else if (match.status === 'teacher_completed') {
        newStatus = 'both_completed'
      }
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { status: newStatus }
    })

    return NextResponse.json({
      message: '답변이 성공적으로 제출되었습니다.',
      status: newStatus
    })
  } catch (error) {
    console.error('답변 제출 실패:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}