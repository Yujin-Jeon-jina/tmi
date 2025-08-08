const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testQuestionCount() {
  try {
    console.log('🧪 질문 개수 테스트 시작...\n');

    // 테스트 매치 생성
    const testMatch = await prisma.match.create({
      data: {
        id: 'TEST_' + Date.now(),
        teacherName: '김선생님',
        teacherPhone: '010-1111-2222',
        studentName: '박학생',
        studentPhone: '010-3333-4444',
        status: 'waiting'
      }
    });

    console.log(`✅ 테스트 매치 생성: ${testMatch.id}\n`);

    // 선생님 질문 개수 확인 (카테고리별 3개씩)
    console.log('👨‍🏫 선생님이 답변할 질문들 (학생→선생님):');
    
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
      
      console.log(`  📂 ${category.name}: ${categoryQuestions.length}개`);
      categoryQuestions.forEach((q, index) => {
        console.log(`    ${index + 1}. ${q.questionText}`);
      });
      console.log('');
      
      teacherQuestions.push(...categoryQuestions);
    }

    console.log(`🔢 선생님 질문 총 개수: ${teacherQuestions.length}개\n`);

    // 학생 질문 개수 확인 (카테고리별 3개씩)
    console.log('👨‍🎓 학생이 답변할 질문들 (선생님→학생):');
    
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
      
      console.log(`  📂 ${category.name}: ${categoryQuestions.length}개`);
      categoryQuestions.forEach((q, index) => {
        console.log(`    ${index + 1}. ${q.questionText}`);
      });
      console.log('');
      
      studentQuestions.push(...categoryQuestions);
    }

    console.log(`🔢 학생 질문 총 개수: ${studentQuestions.length}개\n`);

    // 전체 요약
    console.log('📊 요약:');
    console.log(`- 선생님 카테고리: ${teacherCategories.length}개`);
    console.log(`- 학생 카테고리: ${studentCategories.length}개`);
    console.log(`- 선생님 질문: ${teacherQuestions.length}개 (목표: 15개)`);
    console.log(`- 학생 질문: ${studentQuestions.length}개 (목표: 15개)`);
    
    if (teacherQuestions.length === 15 && studentQuestions.length === 15) {
      console.log('\n✅ 성공! 각각 15개씩 정확히 나왔습니다!');
    } else {
      console.log('\n❌ 목표와 다릅니다. 설정을 확인해주세요.');
    }

    // 테스트 매치 삭제
    await prisma.match.delete({
      where: { id: testMatch.id }
    });
    console.log(`\n🗑️ 테스트 매치 삭제 완료`);

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuestionCount();