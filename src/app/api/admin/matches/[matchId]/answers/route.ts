import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    // 관리자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { matchId } = await params

    // 매치 정보 조회
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 답변 조회 (질문 포함)
    const answers = await prisma.answer.findMany({
      where: { matchId },
      include: {
        teachersQuestion: {
          include: { category: true }
        },
        studentsQuestion: {
          include: { category: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // 선생님과 학생 답변 분리
    const teacherAnswers = answers.filter(a => a.userType === 'teacher')
    const studentAnswers = answers.filter(a => a.userType === 'student')

    // 응답 포맷 정리
    const formattedTeacherAnswers = teacherAnswers.map(answer => ({
      id: answer.id,
      questionId: answer.teachersQuestionId,
      questionText: answer.teachersQuestion?.questionText || '',
      categoryName: answer.teachersQuestion?.category?.name || '',
      content: answer.content,
      createdAt: answer.createdAt
    }))

    const formattedStudentAnswers = studentAnswers.map(answer => ({
      id: answer.id,
      questionId: answer.studentsQuestionId,
      questionText: answer.studentsQuestion?.questionText || '',
      categoryName: answer.studentsQuestion?.category?.name || '',
      content: answer.content,
      createdAt: answer.createdAt
    }))

    return NextResponse.json({
      match: {
        id: match.id,
        teacherName: match.teacherName,
        teacherPhone: match.teacherPhone,
        studentName: match.studentName,
        studentPhone: match.studentPhone,
        status: match.status,
        createdAt: match.createdAt,
        pdfUrl: match.pdfUrl
      },
      teacherAnswers: formattedTeacherAnswers,
      studentAnswers: formattedStudentAnswers,
      totalAnswers: answers.length
    })
  } catch (error) {
    console.error('답변 조회 실패:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}