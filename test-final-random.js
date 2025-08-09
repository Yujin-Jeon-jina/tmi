const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 최종 개선된 질문 선택 로직 (API와 동일)
function selectRandomQuestionsFinal(allQuestions, matchId, categoryId, userType) {
  const seed = matchId + '_' + categoryId + '_' + userType;
  const shuffled = allQuestions
    .map(question => {
      // 문자열 해시 생성 (더 강력한 랜덤성)
      let hash = 0;
      const str = seed + '_' + question.id;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32비트 정수로 변환
      }
      return { question, sort: Math.abs(hash) };
    })
    .sort((a, b) => a.sort - b.sort)
    .map(item => item.question);
  
  return shuffled.slice(0, 3);
}

async function testFinalRandom() {
  try {
    console.log('🧪 최종 개선된 매치별 질문 랜덤성 테스트...\n');

    const testMatches = [
      'cme3pm38d0000ic0452pzppk8', // 실제 매치 ID 스타일
      'cme4aa22f0000jd0456xttttt',
      'cme5bb33g0000ke0467yrrrrr',
      'cme6cc44h0000lf0478zqqqqq',
      'cme7dd55i0000mg0489awwwww',
      'cme8ee66j0000nh049azzzzz'
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
      const selectedQuestions = selectRandomQuestionsFinal(
        [...allQuestions],
        matchId, 
        teacherCategory.id,
        'teacher'
      );

      results[matchId] = selectedQuestions.map(q => q.id);

      console.log(`🎯 ${matchId.substring(0, 12)}...:`);
      selectedQuestions.forEach((q, index) => {
        console.log(`  ${index + 1}. [ID:${q.id}] ${q.questionText.substring(0, 45)}...`);
      });
      console.log('');
    }

    // 매치간 유사도 분석
    console.log('📊 매치별 질문 다양성 분석:');
    const matchIds = Object.keys(results);
    let totalComparisons = 0;
    let totalDifferences = 0;
    let perfectMatches = 0;
    let uniqueMatches = 0;
    
    for (let i = 0; i < matchIds.length; i++) {
      for (let j = i + 1; j < matchIds.length; j++) {
        const match1 = matchIds[i];
        const match2 = matchIds[j];
        
        const ids1 = results[match1];
        const ids2 = results[match2];
        
        const commonIds = ids1.filter(id => ids2.includes(id));
        const differentQuestions = 3 - commonIds.length;
        const uniquePercent = (differentQuestions / 3 * 100).toFixed(1);
        
        totalComparisons++;
        totalDifferences += differentQuestions;
        
        if (commonIds.length === 3) perfectMatches++;
        if (commonIds.length === 0) uniqueMatches++;
        
        console.log(`  ${match1.substring(0, 8)}... vs ${match2.substring(0, 8)}...: 다른 질문 ${differentQuestions}/3개 (${uniquePercent}%)`);
      }
    }
    
    const avgDifference = (totalDifferences / totalComparisons).toFixed(1);
    const randomnessScore = (avgDifference / 3 * 100).toFixed(1);
    const uniqueScore = (uniqueMatches / totalComparisons * 100).toFixed(1);
    
    console.log(`\n📈 통계 요약:`);
    console.log(`  평균 차이: ${avgDifference}/3개 질문이 다름`);
    console.log(`  🎯 랜덤성 점수: ${randomnessScore}%`);
    console.log(`  ✨ 완전히 다른 매치: ${uniqueMatches}/${totalComparisons}개 (${uniqueScore}%)`);
    console.log(`  ⚠️  완전히 같은 매치: ${perfectMatches}/${totalComparisons}개`);
    
    if (perfectMatches === 0 && parseFloat(randomnessScore) >= 70) {
      console.log('\n🎉 훌륭합니다! 매치별 질문 다양성이 충분히 확보되었습니다!');
    } else if (perfectMatches === 0) {
      console.log('\n✅ 좋습니다! 동일한 매치는 없지만 더 다양성을 높일 수 있습니다.');
    } else {
      console.log('\n❌ 문제! 일부 매치가 동일한 질문을 가지고 있습니다.');
    }

    // 개별 매치 질문 요약
    console.log('\n📋 각 매치별 선택된 질문 ID:');
    Object.entries(results).forEach(([matchId, questionIds]) => {
      console.log(`  ${matchId.substring(0, 12)}...: [${questionIds.join(', ')}]`);
    });

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalRandom();