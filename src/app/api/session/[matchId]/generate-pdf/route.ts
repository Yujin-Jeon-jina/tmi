import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePdfHtml } from '@/lib/pdf-template'
import fs from 'fs'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params
  
  try {

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
      orderBy: { id: 'asc' }
    });

    for (const category of teacherCategories) {
      const categoryQuestions = await prisma.teachersQuestion.findMany({
        where: { 
          categoryId: category.id,
          isActive: true 
        },
        include: { category: true },
        orderBy: { id: 'asc' },
        take: 3
      });
      teachersQuestions.push(...categoryQuestions);
    }

    // 학생 질문들 (카테고리별 3개씩)
    const studentCategories = await prisma.category.findMany({
      where: { role: 'student' },
      orderBy: { id: 'asc' }
    });

    for (const category of studentCategories) {
      const categoryQuestions = await prisma.studentsQuestion.findMany({
        where: { 
          categoryId: category.id,
          isActive: true 
        },
        include: { category: true },
        orderBy: { id: 'asc' },
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

    // PDF 파일 이름 및 경로 설정
    const pdfFileName = `${matchId}.pdf`
    const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV;
    
    let pdfFilePath: string;
    let pdfUrl: string;
    
    if (isVercel) {
      // Vercel 환경에서는 /tmp 디렉토리 사용
      pdfFilePath = path.join('/tmp', pdfFileName)
      pdfUrl = `/pdfs/${pdfFileName}` // URL은 동일하게 유지
    } else {
      // 로컬 환경에서는 public/pdfs 사용
      const publicDir = path.join(process.cwd(), 'public', 'pdfs')
      pdfFilePath = path.join(publicDir, pdfFileName)
      pdfUrl = `/pdfs/${pdfFileName}`
      
      // public/pdfs 디렉토리가 없으면 생성
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }
    }

    // 환경에 따른 Puppeteer 설정
    let browser;
    
    console.log('PDF 생성 시작:', { isVercel, matchId });
    
    try {
      if (isVercel) {
        console.log('Vercel 환경에서 puppeteer-core + chromium 사용');
        // Vercel 환경에서 puppeteer-core + chromium 사용
        const chromium = (await import('@sparticuz/chromium')).default;
        const puppeteer = await import('puppeteer-core');
        
        browser = await puppeteer.launch({
          args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
          executablePath: await chromium.executablePath(),
          headless: true,
        });
        console.log('Vercel 브라우저 시작 성공');
      } else {
        console.log('로컬 환경에서 일반 puppeteer 사용');
        // 로컬 환경에서 일반 puppeteer 사용
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('로컬 브라우저 시작 성공');
      }
    } catch (browserError: any) {
      console.error('브라우저 시작 실패:', browserError);
      throw new Error(`브라우저 시작 실패: ${browserError?.message || browserError}`);
    }
    
    try {
      console.log('페이지 생성 중...');
      const page = await browser.newPage()
      console.log('HTML 컨텐츠 설정 중...');
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
      
      console.log('PDF 생성 중...', pdfFilePath);
      
      if (isVercel) {
        // Vercel에서는 PDF를 Buffer로 생성
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
        console.log('PDF Buffer 생성 완료');
        
        // 브라우저 종료
        await browser.close()
        
        // 매치에 PDF URL 저장
        await prisma.match.update({
          where: { id: matchId },
          data: { pdfUrl }
        })
        
        // PDF를 직접 반환
        return new NextResponse(pdfBuffer as Uint8Array, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${matchId}.pdf"`
          }
        })
      } else {
        // 로컬에서는 파일로 저장
        await page.pdf({
          path: pdfFilePath,
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          }
        })
        console.log('PDF 파일 생성 완료');
      }
    } catch (pdfError: any) {
      console.error('PDF 생성 과정에서 오류:', pdfError);
      throw new Error(`PDF 생성 실패: ${pdfError?.message || pdfError}`);
    } finally {
      if (browser && !isVercel) {
        console.log('브라우저 종료 중...');
        await browser.close()
      }
    }
    
    if (!isVercel) {
      // 로컬 환경에서만 JSON 응답 반환
      // 매치에 PDF URL 저장
      await prisma.match.update({
        where: { id: matchId },
        data: { pdfUrl }
      })

      return NextResponse.json({
        message: 'PDF가 성공적으로 생성되었습니다.',
        pdfUrl,
        matchData: {
          teacherName: match.teacherName,
          studentName: match.studentName,
          createdAt: match.createdAt.toISOString()
        }
      })
    }
  } catch (error: any) {
    console.error('PDF 생성 실패:', {
      error: error?.message || error,
      stack: error?.stack,
      matchId,
      isVercel: !!process.env.VERCEL || !!process.env.VERCEL_ENV
    })
    return NextResponse.json({ 
      error: `PDF 생성 중 오류가 발생했습니다: ${error?.message || error}` 
    }, { status: 500 })
  }
}