interface Answer {
  questionId: number
  content: string
  question: {
    content: string
    order: number
  }
}

interface PdfData {
  match: {
    teacherName: string
    studentName: string
    createdAt: string
  }
  teacherAnswers: Answer[]
  studentAnswers: Answer[]
}

export function generatePdfHtml(data: PdfData): string {
  const { match, teacherAnswers, studentAnswers } = data
  
  // 질문 순서대로 정렬 (ID 기준)
  const sortedTeacherAnswers = teacherAnswers.sort((a, b) => a.question.id - b.question.id)
  const sortedStudentAnswers = studentAnswers.sort((a, b) => a.question.id - b.question.id)

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>만반잘부.zip 답변지</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=Jua&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Noto Sans KR', sans-serif;
          line-height: 1.6;
          color: #2d3748;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          overflow: hidden;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        .header {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        
        .header h1 {
          font-family: 'Jua', cursive;
          font-size: 28px;
          font-weight: 400;
          margin-bottom: 8px;
        }
        
        .header .subtitle {
          font-size: 15px;
          font-weight: 400;
          opacity: 0.9;
        }
        
        .content {
          padding: 40px;
          position: relative;
        }
        
        .intro {
          text-align: center;
          margin-bottom: 40px;
          padding: 20px;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 15px;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        .intro h2 {
          font-size: 22px;
          color: #2d3748;
          margin-bottom: 10px;
          font-weight: 600;
        }
        
        .intro p {
          color: #4a5568;
          font-size: 15px;
          font-weight: 400;
        }
        
        .section {
          margin-bottom: 40px;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          margin-bottom: 25px;
          padding: 15px 20px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .teacher-section .section-header {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
        }
        
        .student-section .section-header {
          background: linear-gradient(135deg, #fed7aa 0%, #fb923c 100%);
          color: #9a3412;
        }
        
        .icon {
          font-size: 20px;
          margin-right: 10px;
        }
        
        .question-item {
          margin-bottom: 20px;
          padding: 20px;
          background: #fafafa;
          border-radius: 12px;
          border-left: 4px solid #f97316;
        }
        
        .question-number {
          display: inline-block;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          text-align: center;
          line-height: 30px;
          font-weight: 600;
          margin-right: 12px;
          font-size: 14px;
        }
        
        .question-text {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 10px;
        }
        
        .answer-text {
          font-size: 15px;
          color: #4a5568;
          line-height: 1.7;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .footer {
          background: #f8fafc;
          text-align: center;
          padding: 20px;
          color: #64748b;
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        
        .date {
          color: #636e72;
          font-size: 14px;
          margin-top: 10px;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .container {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 만반잘부.zip 답변지</h1>
          <div class="subtitle">${match.teacherName} 선생님과 ${match.studentName} 학생의 이야기</div>
          <div class="date">생성일: ${new Date(match.createdAt).toLocaleDateString('ko-KR')}</div>
        </div>
        
        <div class="content">
          <div class="intro">
            <h2>서로 알아가는 시간</h2>
            <p>만나서 반가워, 잘 부탁해! 질문과 답변을 통해 자연스럽게 친해져보세요.</p>
          </div>
          
          <div class="section teacher-section">
            <div class="section-header">
              <span class="icon">👨‍🏫</span>
              ${match.teacherName} 선생님의 답변
            </div>
            ${sortedTeacherAnswers.map((answer, index) => `
              <div class="question-item">
                <div class="question-text">
                  <span class="question-number">${index + 1}</span>
                  ${answer.question.content}
                </div>
                <div class="answer-text">${answer.content || '답변을 작성하지 않았습니다.'}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="section student-section">
            <div class="section-header">
              <span class="icon">👨‍🎓</span>
              ${match.studentName} 학생의 답변
            </div>
            ${sortedStudentAnswers.map((answer, index) => `
              <div class="question-item">
                <div class="question-text">
                  <span class="question-number">${index + 1}</span>
                  ${answer.question.content}
                </div>
                <div class="answer-text">${answer.content || '답변을 작성하지 않았습니다.'}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="footer">
          <p>만반잘부.zip 웹 서비스에서 생성된 답변지</p>
          <p>서로의 답변을 통해 친해지는 시간을 만들어보세요</p>
        </div>
      </div>
    </body>
    </html>
  `
}