'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Question {
  id: number
  questionText: string
  categoryId: number
  tone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  category: {
    id: number
    role: string
    name: string
    description: string
    createdAt: string
  }
}

interface Match {
  id: string
  teacherName: string
  studentName: string
  status: string
}

interface Answer {
  id: number
  matchId: string
  teachersQuestionId?: number
  studentsQuestionId?: number
  userType: string
  content: string
  createdAt: string
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const { matchId, userType } = params
  
  const [match, setMatch] = useState<Match | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    if (matchId && userType) {
      fetchSessionData()
    }
  }, [matchId, userType])

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/session/${matchId}/${userType}`)
      if (response.ok) {
        const data = await response.json()
        setMatch(data.match)
        setQuestions(data.questions)
        
        // 이미 제출한 답변이 있는지 확인
        if (data.existingAnswers && data.existingAnswers.length > 0) {
          setIsSubmitted(true)
          const answerMap: { [key: number]: string } = {}
          data.existingAnswers.forEach((answer: Answer) => {
            const questionId = answer.teachersQuestionId || answer.studentsQuestionId
            if (questionId) {
              answerMap[questionId] = answer.content
            }
          })
          setAnswers(answerMap)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || '세션을 찾을 수 없습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const answersArray = questions.map(question => ({
        questionId: question.id,
        content: answers[question.id] || ''
      }))

      const response = await fetch(`/api/session/${matchId}/${userType}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: answersArray })
      })

      if (response.ok) {
        setIsSubmitted(true)
        // 결과 페이지로 리다이렉트
        router.push(`/session/${matchId}/${userType}/result`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || '제출에 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isTeacher = userType === 'teacher'
  const userName = isTeacher ? match?.teacherName : match?.studentName
  const otherUserName = isTeacher ? match?.studentName : match?.teacherName
  const userIcon = isTeacher ? '👨‍🏫' : '👨‍🎓'
  const userColor = isTeacher ? 'orange' : 'yellow'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">앗, 문제가 발생했어요!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">답변이 제출되었어요!</h2>
          <p className="text-gray-600 mb-6">결과 페이지로 이동 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl mb-4">{userIcon}</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {userName} {isTeacher ? '선생님' : '학생'}, 안녕하세요!
            </h1>
            <p className="text-gray-600">
              {otherUserName} {isTeacher ? '학생' : '선생님'}과 친해지는 파일을 만들어볼까요?
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className={`${isTeacher ? 'bg-orange-50' : 'bg-yellow-50'} rounded-2xl p-4 mb-6`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📦</span>
            <h3 className={`font-semibold ${isTeacher ? 'text-orange-800' : 'text-yellow-800'}`}>만반잘부.zip 질문에 답해주세요!</h3>
          </div>
          <p className={`${isTeacher ? 'text-orange-700' : 'text-yellow-700'} text-sm`}>
            서로에 대해 알아가며 친해지는 압축 파일을 만들어요!
            모든 질문에 답하신 후 제출 버튼을 눌러주세요.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className={`${isTeacher ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'} rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    {question.questionText}
                  </h4>
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
    
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none h-24 text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || questions.some(q => !answers[q.id]?.trim())}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isSubmitting ? '압축 중...' : '📦 압축 파일에 넣기!'}
          </button>
          
          {questions.some(q => !answers[q.id]?.trim()) && (
            <p className="text-gray-500 text-sm mt-2">
              모든 질문에 답변해주세요!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}