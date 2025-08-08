import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100">
      {/* Header */}
      <nav className="p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-800">
            📦 만반잘부.zip
          </div>
          <Link 
            href="/admin/login"
            className="bg-white/70 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-2xl font-medium hover:bg-white/90 transition-all duration-300"
          >
            관리자 로그인
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Title */}
          <div className="text-6xl mb-6 animate-bounce">
            📦✨🤝
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            만나서 반가워,
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"> 잘 부탁해!</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
            비대면 과외 선생님과 학생이 서로에 대한 재미있는 질문을 나누며<br />
            친해질 수 있는 모든 걸 한 번에 압축해서 제공해드려요! 📦
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">압축된 질문들</h3>
              <p className="text-gray-600">친해지는 데 필요한 모든 질문을 zip 파일처럼 깔끔하게 정리했어요</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">압축 해제</h3>
              <p className="text-gray-600">두 사람 모두 답변을 완료하면 바로 친해지는 파일이 압축 해제돼요</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">완벽한 패키지</h3>
              <p className="text-gray-600">서로의 답변을 보기 좋게 정리한 완벽한 패키지를 제공해드려요</p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 mb-12 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">📦 압축 해제 과정</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h4 className="font-semibold text-gray-800 mb-2">파일 생성</h4>
                <p className="text-sm text-gray-600">관리자가 선생님과 학생 정보를 입력</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h4 className="font-semibold text-gray-800 mb-2">링크 전달</h4>
                <p className="text-sm text-gray-600">각자에게 개인 맞춤 압축 파일 링크 전송</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h4 className="font-semibold text-gray-800 mb-2">답변 입력</h4>
                <p className="text-sm text-gray-600">재미있는 질문들에 자유롭게 답변</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">4</div>
                <h4 className="font-semibold text-gray-800 mb-2">압축 해제!</h4>
                <p className="text-sm text-gray-600">서로의 답변을 보며 친해지기 완료</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link 
              href="/admin/login"
              className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-12 py-4 rounded-3xl font-bold text-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              📦 압축 파일 만들러 가기
            </Link>
            <p className="text-gray-500 text-sm mt-4">
              관리자 로그인: admin / admin123
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500">
        <p>📦 만반잘부.zip - 만나서 반가워, 잘 부탁해! 모든 걸 압축해서 한 번에!</p>
      </footer>
    </div>
  )
}