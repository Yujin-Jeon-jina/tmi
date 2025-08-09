'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Match {
  id: string
  teacherName: string
  studentName: string
  status: string
  pdfUrl?: string
}

export default function ResultPage() {
  const params = useParams()
  const { matchId, userType } = params
  
  const [match, setMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  useEffect(() => {
    if (matchId && userType) {
      fetchMatchStatus()
      // 5초마다 상태 확인 (실시간 업데이트)
      const interval = setInterval(fetchMatchStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [matchId, userType]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMatchStatus = async () => {
    try {
      const response = await fetch(`/api/session/${matchId}/status`)
      if (response.ok) {
        const data = await response.json()
        setMatch(data.match)
      } else {
        const errorData = await response.json()
        setError(errorData.error || '매치 정보를 가져올 수 없습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const generatePdf = async () => {
    setIsGeneratingPdf(true)
    try {
      const response = await fetch(`/api/session/${matchId}/generate-pdf`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await response.json() // PDF 생성 응답 확인
        
        // 매치 정보 다시 가져오기 (PDF URL이 업데이트됨)
        fetchMatchStatus()
        
        // 성공 메시지 표시
        alert('PDF가 성공적으로 생성되었습니다!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'PDF 생성에 실패했습니다.')
      }
    } catch {
      setError('PDF 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const downloadPdf = () => {
    if (match?.pdfUrl) {
      window.open(match.pdfUrl, '_blank')
    }
  }

  const isTeacher = userType === 'teacher'
  const userName = isTeacher ? match?.teacherName : match?.studentName
  const otherUserName = isTeacher ? match?.studentName : match?.teacherName
  const waitingIcon = isTeacher ? '👨‍🎓' : '👨‍🏫'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">상태 확인 중...</p>
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

  // 상대방이 아직 답변을 완료하지 않은 경우
  if (match?.status !== 'both_completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-6 animate-bounce">{waitingIcon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">거의 다 왔어요!</h2>
          <p className="text-gray-600 mb-6">
            <span className="font-semibold text-orange-600">{otherUserName}</span>
            {isTeacher ? ' 학생' : ' 선생님'}이 답변을 완료하기를 기다리고 있어요!
          </p>
          
          <div className="bg-yellow-50 p-4 rounded-2xl mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg">⏳</span>
              <span className="font-medium text-yellow-800">현재 상태</span>
            </div>
            <p className="text-yellow-700 text-sm">
              {match?.status === 'teacher_completed' && '선생님이 답변을 완료했어요!'}
              {match?.status === 'student_completed' && '학생이 답변을 완료했어요!'}
              {match?.status === 'waiting' && '아직 아무도 답변을 완료하지 않았어요.'}
            </p>
          </div>

          <div className="text-gray-500 text-sm">
            <p>페이지가 자동으로 업데이트됩니다.</p>
            <p>잠시만 기다려주세요! 📦</p>
          </div>
        </div>
      </div>
    )
  }

  // 양쪽 모두 답변 완료한 경우
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full">
        <div className="text-6xl mb-6">📦</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          압축 해제 완료! ✨
        </h2>
        <p className="text-xl text-gray-700 mb-2">
          이제 서로에 대해 알아볼 시간이에요!
        </p>
        <p className="text-gray-600 mb-8">
          <span className="font-semibold text-orange-600">{userName}</span>
          {isTeacher ? ' 선생님' : ' 학생'}과 
          <span className="font-semibold text-red-600"> {otherUserName}</span>
          {isTeacher ? ' 학생' : ' 선생님'}의 답변이 모두 준비되었어요!
        </p>

        {/* PDF 다운로드 버튼 */}
        {match.pdfUrl ? (
          <button
            onClick={downloadPdf}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 mb-4"
          >
            📦 만반잘부.zip 다운로드
          </button>
        ) : (
          <button
            onClick={generatePdf}
            disabled={isGeneratingPdf}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isGeneratingPdf ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                생성 중...
              </span>
            ) : (
              '📦 압축 파일 생성하기'
            )}
          </button>
        )}

        <div className="bg-orange-50 p-4 rounded-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">✨</span>
            <span className="font-medium text-orange-800">만반잘부 팁!</span>
          </div>
          <p className="text-orange-700 text-sm">
            서로의 답변을 보며 자연스럽게 대화를 시작해보세요.
            공통점을 찾거나 궁금한 점을 물어보면 금세 친해질 수 있어요!
          </p>
        </div>
      </div>
    </div>
  )
}