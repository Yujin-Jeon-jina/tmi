const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetPdfUrl() {
  try {
    // 먼저 모든 매치 확인
    const matches = await prisma.match.findMany({
      select: { id: true, teacherName: true, studentName: true, pdfUrl: true, createdAt: true }
    })
    
    console.log('현재 매치들:')
    matches.forEach(match => {
      console.log(`ID: ${match.id}, Teacher: ${match.teacherName}, Student: ${match.studentName}, PDF: ${match.pdfUrl || 'null'}`)
    })
    
    // pdfUrl이 있는 매치들 초기화
    const matchesWithPdf = matches.filter(m => m.pdfUrl)
    if (matchesWithPdf.length > 0) {
      console.log('\nPDF URL이 있는 매치들을 초기화합니다...')
      for (const match of matchesWithPdf) {
        await prisma.match.update({
          where: { id: match.id },
          data: { pdfUrl: null }
        })
        console.log(`✅ ${match.id} 초기화 완료`)
      }
    } else {
      console.log('\nPDF URL이 있는 매치가 없습니다.')
    }
    
  } catch (error) {
    console.error('오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetPdfUrl()