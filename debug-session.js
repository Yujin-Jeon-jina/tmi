const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSession() {
  try {
    console.log('🔍 세션 디버깅 시작...\n');

    // 최근 매치 조회
    const recentMatches = await prisma.match.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`📊 최근 매치 ${recentMatches.length}개:`);
    recentMatches.forEach((match, index) => {
      console.log(`${index + 1}. ID: ${match.id}`);
      console.log(`   선생님: ${match.teacherName} (${match.teacherPhone})`);
      console.log(`   학생: ${match.studentName} (${match.studentPhone})`);
      console.log(`   상태: ${match.status}`);
      console.log('');
    });

    if (recentMatches.length > 0) {
      const testMatch = recentMatches[0];
      console.log(`🧪 테스트 매치: ${testMatch.id}\n`);

      // 선생님 질문 테스트
      console.log('👨‍🏫 선생님 질문 조회 테스트...');
      try {
        const teacherCategories = await prisma.category.findMany({
          where: { role: 'teacher' },
          orderBy: { id: 'asc' }
        });

        let teacherQuestions = [];
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
          teacherQuestions.push(...categoryQuestions);
        }

        console.log(`✅ 선생님 질문 ${teacherQuestions.length}개 조회 성공`);

        // 학생 질문 테스트
        console.log('👨‍🎓 학생 질문 조회 테스트...');
        
        const studentCategories = await prisma.category.findMany({
          where: { role: 'student' },
          orderBy: { id: 'asc' }
        });

        let studentQuestions = [];
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
          studentQuestions.push(...categoryQuestions);
        }

        console.log(`✅ 학생 질문 ${studentQuestions.length}개 조회 성공`);

        // 기존 답변 조회 테스트
        console.log('\n📝 기존 답변 조회 테스트...');
        
        const teacherAnswers = await prisma.answer.findMany({
          where: {
            matchId: testMatch.id,
            userType: 'teacher'
          },
          include: {
            teachersQuestion: true,
            studentsQuestion: true
          }
        });

        const studentAnswers = await prisma.answer.findMany({
          where: {
            matchId: testMatch.id,
            userType: 'student'
          },
          include: {
            teachersQuestion: true,
            studentsQuestion: true
          }
        });

        console.log(`✅ 선생님 답변 ${teacherAnswers.length}개 조회 성공`);
        console.log(`✅ 학생 답변 ${studentAnswers.length}개 조회 성공`);

        console.log(`\n🔗 테스트 링크:`);
        console.log(`선생님: http://localhost:3000/session/${testMatch.id}/teacher`);
        console.log(`학생: http://localhost:3000/session/${testMatch.id}/student`);

      } catch (error) {
        console.error('❌ 세션 데이터 조회 오류:', error);
      }
    }

  } catch (error) {
    console.error('❌ 디버깅 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSession();