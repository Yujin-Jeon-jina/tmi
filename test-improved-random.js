const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 개선된 해시 함수
function betterHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash);
}

// 개선된 질문 선택 로직
function selectRandomQuestionsImproved(allQuestions, matchId, categoryId, userType) {
  const seed = `${matchId}_${categoryId}_${userType}`;
  const baseHash = betterHash(seed);
  
  const shuffled = allQuestions.sort((a, b) => {
    const hashA = betterHash(seed + '_' + a.id) + baseHash;
    const hashB = betterHash(seed + '_' + b.id) + baseHash;
    return hashA - hashB;
  });
  
  return shuffled.slice(0, 3);
}

async function testImprovedRandom() {
  try {
    console.log('🧪 개선된 매치별 질문 랜덤성 테스트...\n');

    const testMatches = [
      'match_A_12345',
      'match_B_67890', 
      'match_C_11111',
      'match_D_22222',
      'match_E_33333'
    ];

    const teacherCategory = await prisma.category.findFirst({
      where: { role: 'teacher' }
    });

    if (!teacherCategory) {
      console.log('❌ 선생님 카테고리를 찾을 수 없습니다.');
      return;
    }

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
      const selectedQuestions = selectRandomQuestionsImproved(
        [...allQuestions],
        matchId, 
        teacherCategory.id, 
        'teacher'
      );

      results[matchId] = selectedQuestions.map(q => q.id);

      console.log(`🎯 ${matchId}:`);
      selectedQuestions.forEach((q, index) => {
        console.log(`  ${index + 1}. [ID:${q.id}] ${q.questionText.substring(0, 60)}...`);
      });
      console.log('');
    }

    // 매치간 유사도 분석
    console.log('📊 매치간 질문 중복 분석:');
    const matchIds = Object.keys(results);
    let totalComparisons = 0;
    let totalDifferences = 0;
    
    for (let i = 0; i < matchIds.length; i++) {
      for (let j = i + 1; j < matchIds.length; j++) {
        const match1 = matchIds[i];
        const match2 = matchIds[j];
        
        const ids1 = results[match1];
        const ids2 = results[match2];
        
        const commonIds = ids1.filter(id => ids2.includes(id));
        const differentQuestions = 6 - commonIds.length;
        const uniquePercent = (differentQuestions / 6 * 100).toFixed(1);
        
        totalComparisons++;
        totalDifferences += differentQuestions;
        
        console.log(`  ${match1} vs ${match2}: 다른 질문 ${differentQuestions}/6개 (${uniquePercent}%)`);
      }
    }
    
    const avgDifference = (totalDifferences / totalComparisons).toFixed(1);
    console.log(`\n📈 평균 차이: ${avgDifference}/6개 질문이 다름`);
    console.log(`🎯 랜덤성 점수: ${(avgDifference / 6 * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImprovedRandom();