const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 현재 질문 선택 로직과 동일한 함수
function selectRandomQuestions(allQuestions, matchId, categoryId, userType) {
  const shuffled = allQuestions.sort((a, b) => {
    const seed = matchId + categoryId + userType + a.id + b.id;
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 2) - 0.5;
  });
  return shuffled.slice(0, 3);
}

async function testRandomMatches() {
  try {
    console.log('🧪 매치별 질문 랜덤성 테스트...\n');

    // 테스트용 매치 ID들
    const testMatches = [
      'test_match_001',
      'test_match_002', 
      'test_match_003'
    ];

    // 선생님 카테고리 하나만 테스트
    const teacherCategory = await prisma.category.findFirst({
      where: { role: 'teacher' }
    });

    if (!teacherCategory) {
      console.log('❌ 선생님 카테고리를 찾을 수 없습니다.');
      return;
    }

    // 해당 카테고리의 모든 질문 가져오기
    const allQuestions = await prisma.teachersQuestion.findMany({
      where: { 
        categoryId: teacherCategory.id,
        isActive: true 
      }
    });

    console.log(`📂 카테고리: ${teacherCategory.name}`);
    console.log(`📊 전체 질문 수: ${allQuestions.length}개\n`);

    const results = {};

    // 각 매치별로 질문 선택
    for (const matchId of testMatches) {
      const selectedQuestions = selectRandomQuestions(
        [...allQuestions], // 배열 복사
        matchId, 
        teacherCategory.id, 
        'teacher'
      );

      results[matchId] = selectedQuestions.map(q => ({
        id: q.id,
        text: q.questionText.substring(0, 50) + '...'
      }));

      console.log(`🎯 ${matchId}:`);
      selectedQuestions.forEach((q, index) => {
        console.log(`  ${index + 1}. [ID:${q.id}] ${q.questionText}`);
      });
      console.log('');
    }

    // 매치간 질문 중복 확인
    console.log('🔍 매치간 질문 중복 분석:');
    const matchIds = Object.keys(results);
    
    for (let i = 0; i < matchIds.length; i++) {
      for (let j = i + 1; j < matchIds.length; j++) {
        const match1 = matchIds[i];
        const match2 = matchIds[j];
        
        const ids1 = results[match1].map(q => q.id);
        const ids2 = results[match2].map(q => q.id);
        
        const commonIds = ids1.filter(id => ids2.includes(id));
        const uniquePercent = ((6 - commonIds.length) / 6 * 100).toFixed(1);
        
        console.log(`  ${match1} vs ${match2}:`);
        console.log(`    공통 질문: ${commonIds.length}개 | 다른 질문: ${6 - commonIds.length}개 | 차이: ${uniquePercent}%`);
        
        if (commonIds.length > 0) {
          console.log(`    중복 ID: [${commonIds.join(', ')}]`);
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRandomMatches();