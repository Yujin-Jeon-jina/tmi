'use client'

import { useState } from 'react'

interface CreateMatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface MatchFormData {
  matchId: string
  teacherName: string
  teacherPhone: string
  studentName: string
  studentPhone: string
}

interface GeneratedUrls {
  teacherUrl: string
  studentUrl: string
}

export default function CreateMatchModal({ isOpen, onClose, onSuccess }: CreateMatchModalProps) {
  const [formData, setFormData] = useState<MatchFormData>({
    matchId: '',
    teacherName: '',
    teacherPhone: '',
    studentName: '',
    studentPhone: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [generatedUrls, setGeneratedUrls] = useState<GeneratedUrls | null>(null)
  const [error, setError] = useState('')
  const [useAutoId, setUseAutoId] = useState(true)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const generateMatchId = () => {
    return 'ZIP' + Date.now().toString().slice(-6)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const finalMatchId = useAutoId ? generateMatchId() : formData.matchId
      
      const response = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          matchId: finalMatchId
        })
      })

      const data = await response.json()

      if (response.ok) {
        const baseUrl = window.location.origin
        setGeneratedUrls({
          teacherUrl: `${baseUrl}/session/${data.match.id}/teacher`,
          studentUrl: `${baseUrl}/session/${data.match.id}/student`
        })
      } else {
        setError(data.error || '매치 생성에 실패했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${type} URL이 클립보드에 복사되었습니다!`)
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
    }
  }

  const handleComplete = () => {
    setFormData({
      matchId: '',
      teacherName: '',
      teacherPhone: '',
      studentName: '',
      studentPhone: ''
    })
    setGeneratedUrls(null)
    setError('')
    onSuccess()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">📦 새 압축 파일 생성</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {!generatedUrls ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 매치 ID 설정 */}
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={useAutoId}
                  onChange={(e) => setUseAutoId(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">자동 생성 ID 사용</span>
              </label>
              
              {!useAutoId && (
                <input
                  type="text"
                  name="matchId"
                  value={formData.matchId}
                  onChange={handleInputChange}
  
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                  required={!useAutoId}
                />
              )}
            </div>

            {/* 선생님 정보 */}
            <div className="bg-orange-50 p-4 rounded-2xl">
              <h4 className="text-lg font-semibold text-orange-800 mb-4">👨‍🏫 선생님 정보</h4>
              <div className="space-y-4">
                <input
                  type="text"
                  name="teacherName"
                  value={formData.teacherName}
                  onChange={handleInputChange}
  
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                  required
                />
                <input
                  type="tel"
                  name="teacherPhone"
                  value={formData.teacherPhone}
                  onChange={handleInputChange}
  
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            </div>

            {/* 학생 정보 */}
            <div className="bg-yellow-50 p-4 rounded-2xl">
              <h4 className="text-lg font-semibold text-yellow-800 mb-4">👨‍🎓 학생 정보</h4>
              <div className="space-y-4">
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
  
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                  required
                />
                <input
                  type="tel"
                  name="studentPhone"
                  value={formData.studentPhone}
                  onChange={handleInputChange}
  
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 py-3 px-4 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-2xl font-medium hover:bg-gray-600 transition-all duration-300"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-2xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '압축 중...' : '📦 압축 파일 생성'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">만반잘부.zip 파일이 생성되었어요!</h4>
              <p className="text-gray-600">아래 링크를 각각 선생님과 학생에게 전달해서 친해지는 시간을 만들어보세요!</p>
            </div>

            <div className="space-y-4">
              {/* 선생님 URL */}
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-semibold text-orange-800">👨‍🏫 선생님용 링크</h5>
                  <button
                    onClick={() => copyToClipboard(generatedUrls.teacherUrl, '선생님')}
                    className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                  >
                    복사
                  </button>
                </div>
                <div className="bg-white p-3 rounded-lg border text-sm break-all text-gray-800">
                  {generatedUrls.teacherUrl}
                </div>
              </div>

              {/* 학생 URL */}
              <div className="bg-yellow-50 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-semibold text-yellow-800">👨‍🎓 학생용 링크</h5>
                  <button
                    onClick={() => copyToClipboard(generatedUrls.studentUrl, '학생')}
                    className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-600 transition-colors"
                  >
                    복사
                  </button>
                </div>
                <div className="bg-white p-3 rounded-lg border text-sm break-all text-gray-800">
                  {generatedUrls.studentUrl}
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-2xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300"
            >
              📦 압축 완료
            </button>
          </div>
        )}
      </div>
    </div>
  )
}