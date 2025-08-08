import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePdfHtml } from '@/lib/pdf-template'
import puppeteer from 'puppeteer'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(
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

    // 양쪽 답변이 모두 완료되었는지 확인
    if (match.status !== 'both_completed') {
      return NextResponse.json({ error: '아직 모든 답변이 완료되지 않았습니다.' }, { status: 400 })
    }

    // 이미 PDF가 생성되어 있으면 기존 URL 반환
    if (match.pdfUrl) {
      return NextResponse.json({ 
        message: 'PDF가 이미 생성되어 있습니다.',
        pdfUrl: match.pdfUrl 
      })
    }

    // 답변 데이터 조회 (카테고리별 3개씩 제한)
    const [teacherAnswers, studentAnswers] = await Promise.all([
      prisma.answer.findMany({
        where: { matchId, userType: 'teacher' },
        include: { 
          teachersQuestion: {
            include: { category: true }
          }
        }
      }),
      prisma.answer.findMany({
        where: { matchId, userType: 'student' },
        include: { 
          studentsQuestion: {
            include: { category: true }
          }
        }
      })
    ])

    // 카테고리별 3개씩 질문 조회 (세션 API와 동일한 로직)
    const teachersQuestions: any[] = [];
    const studentsQuestions: any[] = [];

    // 선생님 질문들 (카테고리별 3개씩)
    const teacherCategories = await prisma.category.findMany({
      where: { role: 'teacher' },
      idBy: { id: 'asc' }
    });

    for (const category of teacherCategories) {
      const categoryQuestions = await prisma.teachersQuestion.findMany({
        where: { 
          categoryId: category.id,
          isActive: true 
        },
        include: { category: true },
        idBy: { id: 'asc' },
        take: 3
      });
      teachersQuestions.push(...categoryQuestions);
    }

    // 학생 질문들 (카테고리별 3개씩)
    const studentCategories = await prisma.category.findMany({
      where: { role: 'student' },
      idBy: { id: 'asc' }
    });

    for (const category of studentCategories) {
      const categoryQuestions = await prisma.studentsQuestion.findMany({
        where: { 
          categoryId: category.id,
          isActive: true 
        },
        include: { category: true },
        idBy: { id: 'asc' },
        take: 3
      });
      studentsQuestions.push(...categoryQuestions);
    }

    // 모든 질문에 대한 답변이 있는지 확인하고, 없는 경우 빈 답변 추가
    const completeTeacherAnswers = teachersQuestions.map(question => {
      const existingAnswer = teacherAnswers.find(a => a.teachersQuestionId === question.id)
      if (existingAnswer) {
        return {
          questionId: question.id,
          content: existingAnswer.content,
          question: {
            content: existingAnswer.teachersQuestion?.questionText || question.questionText,
            id: existingAnswer.teachersQuestion?.id || question.id
          }
        }
      }
      return {
        questionId: question.id,
        content: '',
        question: {
          content: question.questionText,
          id: question.id
        }
      }
    })

    const completeStudentAnswers = studentsQuestions.map(question => {
      const existingAnswer = studentAnswers.find(a => a.studentsQuestionId === question.id)
      if (existingAnswer) {
        return {
          questionId: question.id,
          content: existingAnswer.content,
          question: {
            content: existingAnswer.studentsQuestion?.questionText || question.questionText,
            id: existingAnswer.studentsQuestion?.id || question.id
          }
        }
      }
      return {
        questionId: question.id,
        content: '',
        question: {
          content: question.questionText,
          id: question.id
        }
      }
    })

    // HTML 생성
    const htmlContent = generatePdfHtml({
      match: {
        teacherName: match.teacherName,
        studentName: match.studentName,
        createdAt: match.createdAt.toISOString()
      },
      teacherAnswers: completeTeacherAnswers,
      studentAnswers: completeStudentAnswers
    })

    // PDF 파일 경로 설정
    const pdfDir = path.join(process.cwd(), 'public', 'pdfs')
    const pdfFileName = `${matchId}.pdf`
    const pdfPath = path.join(pdfDir, pdfFileName)
    const pdfUrl = `/pdfs/${pdfFileName}`

    // 디렉토리 생성
    if (!existsSync(pdfDir)) {
      await mkdir(pdfDir, { recursive: true })
    }

    // Puppeteer로 PDF 생성
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    try {
      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })

      // PDF 파일 저장
      await writeFile(pdfPath, pdfBuffer)

      // 매치에 PDF URL 저장
      await prisma.match.update({
        where: { id: matchId },
        data: { pdfUrl }
      })

      return NextResponse.json({
        message: 'PDF가 성공적으로 생성되었습니다.',
        pdfUrl
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    return NextResponse.json({ error: 'PDF 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}