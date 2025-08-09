const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMatch() {
  try {
    console.log('🔍 매치 fya43ohv 정보 조회...\n');

    // 매치 정보 조회
    const match = await prisma.match.findUnique({
      where: { id: 'fya43ohv' }
    });

    if (!match) {
      console.log('❌ 매치를 찾을 수 없습니다.');
      return;
    }

    console.log('📋 매치 정보:');
    console.log(`  ID: ${match.id}`);
    console.log(`  선생님: ${match.teacherName} (${match.teacherPhone})`);
    console.log(`  학생: ${match.studentName} (${match.studentPhone})`);
    console.log(`  상태: ${match.status}`);
    console.log(`  생성일: ${match.createdAt.toISOString()}`);
    console.log(`  PDF URL: ${match.pdfUrl || '없음'}\n`);

    // 답변 조회
    const answers = await prisma.answer.findMany({
      where: { matchId: 'fya43ohv' },
      include: {
        teachersQuestion: {
          include: { category: true }
        },
        studentsQuestion: {
          include: { category: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📝 답변 총 개수: ${answers.length}개\n`);

    if (answers.length === 0) {
      console.log('❌ 아직 답변이 없습니다.');
      return;
    }

    // 선생님 답변
    const teacherAnswers = answers.filter(a => a.userType === 'teacher');
    const studentAnswers = answers.filter(a => a.userType === 'student');

    console.log(`👨‍🏫 선생님 답변 (${teacherAnswers.length}개):`);
    teacherAnswers.forEach((answer, index) => {
      const question = answer.teachersQuestion;
      console.log(`  ${index + 1}. [${question?.category?.name || '카테고리 없음'}] ${question?.questionText || '질문 없음'}`);
      console.log(`     답변: ${answer.content.substring(0, 100)}${answer.content.length > 100 ? '...' : ''}`);
      console.log('');
    });

    console.log(`👨‍🎓 학생 답변 (${studentAnswers.length}개):`);
    studentAnswers.forEach((answer, index) => {
      const question = answer.studentsQuestion;
      console.log(`  ${index + 1}. [${question?.category?.name || '카테고리 없음'}] ${question?.questionText || '질문 없음'}`);
      console.log(`     답변: ${answer.content.substring(0, 100)}${answer.content.length > 100 ? '...' : ''}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ 조회 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMatch();