'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import CreateMatchModal from '@/components/CreateMatchModal'

interface Match {
  id: string
  teacherName: string
  teacherPhone: string
  studentName: string
  studentPhone: string
  status: string
  createdAt: string
  pdfUrl?: string
}

interface Answer {
  id: string
  questionId: number | null
  questionText: string
  categoryName: string
  content: string
  createdAt: string
}

interface MatchAnswers {
  match: Match
  teacherAnswers: Answer[]
  studentAnswers: Answer[]
  totalAnswers: number
}

export default function AdminDashboard() {
  const { status } = useSession()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)
  const [showAnswersModal, setShowAnswersModal] = useState(false)
  const [selectedMatchAnswers, setSelectedMatchAnswers] = useState<MatchAnswers | null>(null)
  const [loadingAnswers, setLoadingAnswers] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return
    }
    fetchMatches()
  }, [status, router])

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/admin/matches')
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches)
      }
    } catch (error) {
      console.error('매치 리스트 가져오기 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('링크가 복사되었습니다!')
    } catch (err) {
      console.error('복사 실패:', err)
      alert('복사에 실패했습니다.')
    }
  }

  const generateTeacherLink = (matchId: string) => {
    return `${window.location.origin}/session/${matchId}/teacher`
  }

  const generateStudentLink = (matchId: string) => {
    return `${window.location.origin}/session/${matchId}/student`
  }

  const generateAndDownloadPdf = async (matchId: string, teacherName: string, studentName: string) => {
    // 이미 생성 중인 경우 중복 실행 방지
    if (generatingPdf === matchId) {
      return
    }

    setGeneratingPdf(matchId)
    
    try {
      const response = await fetch(`/api/session/${matchId}/generate-pdf`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        
        if (contentType?.includes('application/pdf')) {
          // PDF 직접 다운로드 (Vercel 환경)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `만반잘부_${teacherName}_${studentName}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          alert('PDF가 성공적으로 다운로드되었습니다!')
        } else {
          alert('PDF가 성공적으로 생성되었습니다!')
        }
        
        // 매치 리스트 새로고침
        fetchMatches()
      } else {
        const errorData = await response.json()
        alert(`PDF 생성 실패: ${errorData.error}`)
      }
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    } finally {
      setGeneratingPdf(null)
    }
  }

  const viewAnswers = async (matchId: string) => {
    setLoadingAnswers(true)
    try {
      const response = await fetch(`/api/admin/matches/${matchId}/answers`)
      if (response.ok) {
        const data = await response.json()
        setSelectedMatchAnswers(data)
        setShowAnswersModal(true)
      } else {
        const errorData = await response.json()
        alert(`답변 조회 실패: ${errorData.error}`)
      }
    } catch (error) {
      console.error('답변 조회 오류:', error)
      alert('답변 조회 중 오류가 발생했습니다.')
    } finally {
      setLoadingAnswers(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return { text: '대기중', color: 'bg-gray-100 text-gray-600' }
      case 'teacher_completed':
        return { text: '선생님 완료', color: 'bg-blue-100 text-blue-600' }
      case 'student_completed':
        return { text: '학생 완료', color: 'bg-green-100 text-green-600' }
      case 'both_completed':
        return { text: '양쪽 완료', color: 'bg-purple-100 text-purple-600' }
      default:
        return { text: '알 수 없음', color: 'bg-gray-100 text-gray-600' }
    }
  }

  // 검색 및 필터링 로직
  const filteredMatches = matches.filter(match => {
    const matchesSearch = 
      match.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.teacherPhone.includes(searchTerm) ||
      match.studentPhone.includes(searchTerm) ||
      match.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || match.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // 페이지네이션 로직
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMatches = filteredMatches.slice(startIndex, startIndex + itemsPerPage)

  // 검색어나 필터가 변경되면 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, itemsPerPage])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">📦 만반잘부.zip 관리자</h1>
              <p className="text-gray-600 mt-1">친해지는 모든 걸 압축해드려요!</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105"
              >
                📦 새 압축 파일 생성
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="bg-gray-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-gray-600 transition-all duration-300"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            { label: '전체 압축 파일', count: matches.length, icon: '📦', color: 'from-orange-400 to-red-500' },
            { label: '대기중', count: matches.filter(m => m.status === 'waiting').length, icon: '⏳', color: 'from-yellow-400 to-orange-500' },
            { label: '진행중', count: matches.filter(m => m.status.includes('completed') && m.status !== 'both_completed').length, icon: '⚡', color: 'from-amber-400 to-orange-600' },
            { label: '압축 해제 완료', count: matches.filter(m => m.status === 'both_completed').length, icon: '🎉', color: 'from-red-400 to-red-600' }
          ].map((stat, index) => (
            <div key={index} className={`bg-gradient-to-r ${stat.color} text-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.count}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색바 */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-lg">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="이름, 전화번호, ID로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            
            {/* 상태 필터 */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all duration-300 text-gray-900"
              >
                <option value="all">전체 상태</option>
                <option value="waiting">⏳ 대기중</option>
                <option value="teacher_completed">👨‍🏫 선생님 완료</option>
                <option value="student_completed">👨‍🎓 학생 완료</option>
                <option value="both_completed">🎉 양쪽 완료</option>
              </select>
            </div>
            
            {/* 검색 결과 카운트 */}
            <div className="flex items-center">
              <div className="bg-gray-100 px-4 py-3 rounded-xl">
                <span className="text-sm text-gray-600">
                  {filteredMatches.length}개 / {matches.length}개
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Matches List */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">📋 매치 리스트</h2>
              <div className="text-sm text-gray-500">
                {filteredMatches.length > 0 ? (
                  <>
                    {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredMatches.length)} / {filteredMatches.length}개
                    {filteredMatches.length !== matches.length && (
                      <span className="ml-1">(전체 {matches.length}개)</span>
                    )}
                  </>
                ) : (
                  '검색 결과가 없습니다'
                )}
              </div>
            </div>
          </div>
          
          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">
                {matches.length === 0 ? '🫣' : '🔍'}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {matches.length === 0 ? '아직 압축할 파일이 없어요' : '검색 결과가 없습니다'}
              </h3>
              <p className="text-gray-600 mb-6">
                {matches.length === 0 
                  ? '첫 번째 압축 파일을 생성해서 친해지는 시간을 만들어보세요!'
                  : '다른 검색어나 필터를 시도해보세요.'
                }
              </p>
              {matches.length === 0 && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105"
                >
                  📦 새 압축 파일 생성
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="grid gap-4">
                {paginatedMatches.map((match) => {
                  const statusInfo = getStatusText(match.status)
                  return (
                    <div key={match.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Left Section - Basic Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-mono px-3 py-1 rounded-lg">
                              ID: {match.id.slice(-8)}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} flex items-center gap-1`}>
                              <span className="text-lg">
                                {match.status === 'waiting' && '⏳'}
                                {match.status === 'teacher_completed' && '👨‍🏫'}
                                {match.status === 'student_completed' && '👨‍🎓'}
                                {match.status === 'both_completed' && '🎉'}
                              </span>
                              {statusInfo.text}
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Teacher Info */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">👨‍🏫</span>
                                <span className="font-medium text-blue-800">선생님</span>
                              </div>
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900">{match.teacherName}</div>
                                <div className="text-sm text-gray-600 font-mono">{match.teacherPhone}</div>
                              </div>
                            </div>
                            
                            {/* Student Info */}
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">👨‍🎓</span>
                                <span className="font-medium text-green-800">학생</span>
                              </div>
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900">{match.studentName}</div>
                                <div className="text-sm text-gray-600 font-mono">{match.studentPhone}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span>📅</span>
                            <span>생성일: {new Date(match.createdAt).toLocaleDateString('ko-KR', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'short'
                            })}</span>
                          </div>
                        </div>
                        
                        {/* Right Section - Actions */}
                        <div className="lg:w-48 flex lg:flex-col gap-2">
                          <button 
                            onClick={() => copyToClipboard(generateTeacherLink(match.id))}
                            className="flex-1 lg:w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                            title="선생님 링크 복사"
                          >
                            <span>👨‍🏫</span>
                            <span className="hidden sm:inline">선생님 링크</span>
                            <span className="sm:hidden">링크</span>
                          </button>
                          
                          <button 
                            onClick={() => copyToClipboard(generateStudentLink(match.id))}
                            className="flex-1 lg:w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                            title="학생 링크 복사"
                          >
                            <span>👨‍🎓</span>
                            <span className="hidden sm:inline">학생 링크</span>
                            <span className="sm:hidden">링크</span>
                          </button>
                          
                          {(match.status === 'teacher_completed' || match.status === 'student_completed' || match.status === 'both_completed') && (
                            <button 
                              onClick={() => viewAnswers(match.id)}
                              disabled={loadingAnswers}
                              className={`flex-1 lg:w-full ${
                                loadingAnswers 
                                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transform hover:scale-105'
                              } text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2`}
                              title="답변 내용 보기"
                            >
                              {loadingAnswers ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span className="hidden sm:inline">조회 중...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <span>💬</span>
                                  <span className="hidden sm:inline">답변 보기</span>
                                  <span className="sm:hidden">답변</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          {match.status === 'both_completed' && (
                            <button 
                              onClick={() => generateAndDownloadPdf(match.id, match.teacherName, match.studentName)}
                              disabled={generatingPdf === match.id}
                              className={`flex-1 lg:w-full ${
                                generatingPdf === match.id 
                                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transform hover:scale-105'
                              } text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2`}
                              title={generatingPdf === match.id ? "PDF 생성 중..." : "PDF 생성 및 다운로드"}
                            >
                              {generatingPdf === match.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span className="hidden sm:inline">생성 중...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <span>📄</span>
                                  <span className="hidden sm:inline">PDF 다운로드</span>
                                  <span className="sm:hidden">PDF</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* 페이지 정보 */}
                    <div className="text-sm text-gray-600">
                      페이지 {currentPage} / {totalPages}
                    </div>
                    
                    {/* 페이지 네비게이션 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        ⏮️
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        ⬅️
                      </button>
                      
                      {/* 페이지 번호들 */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                currentPage === pageNum
                                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        ➡️
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        ⏭️
                      </button>
                    </div>
                    
                    {/* 페이지 크기 선택 */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>페이지당</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          const newSize = parseInt(e.target.value)
                          setItemsPerPage(newSize)
                          setCurrentPage(1)
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      >
                        <option value={5}>5개</option>
                        <option value={10}>10개</option>
                        <option value={20}>20개</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Match Modal */}
      <CreateMatchModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={fetchMatches}
      />

      {/* Answers Modal */}
      {showAnswersModal && selectedMatchAnswers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">답변 내용</h2>
                  <p className="text-indigo-100 mt-1">
                    {selectedMatchAnswers.match.teacherName} 선생님 ↔ {selectedMatchAnswers.match.studentName} 학생
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAnswersModal(false)
                    setSelectedMatchAnswers(null)
                  }}
                  className="text-white hover:text-indigo-200 transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedMatchAnswers.totalAnswers === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">아직 답변이 없습니다</h3>
                  <p className="text-gray-500">선생님이나 학생이 답변을 작성하면 여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* 선생님 답변 */}
                  {selectedMatchAnswers.teacherAnswers.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>👨‍🏫</span>
                        선생님 답변 ({selectedMatchAnswers.teacherAnswers.length}개)
                      </h3>
                      <div className="space-y-4">
                        {selectedMatchAnswers.teacherAnswers.map((answer, index) => (
                          <div key={answer.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium">
                                    {answer.categoryName}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {new Date(answer.createdAt).toLocaleDateString('ko-KR', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="font-medium text-gray-800 mb-2">{answer.questionText}</p>
                                <div className="bg-white border border-blue-200 rounded-lg p-3">
                                  <p className="text-gray-700 whitespace-pre-wrap">{answer.content}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 학생 답변 */}
                  {selectedMatchAnswers.studentAnswers.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>👨‍🎓</span>
                        학생 답변 ({selectedMatchAnswers.studentAnswers.length}개)
                      </h3>
                      <div className="space-y-4">
                        {selectedMatchAnswers.studentAnswers.map((answer, index) => (
                          <div key={answer.id} className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
                                    {answer.categoryName}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {new Date(answer.createdAt).toLocaleDateString('ko-KR', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="font-medium text-gray-800 mb-2">{answer.questionText}</p>
                                <div className="bg-white border border-green-200 rounded-lg p-3">
                                  <p className="text-gray-700 whitespace-pre-wrap">{answer.content}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  총 {selectedMatchAnswers.totalAnswers}개의 답변
                </div>
                <button
                  onClick={() => {
                    setShowAnswersModal(false)
                    setSelectedMatchAnswers(null)
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}