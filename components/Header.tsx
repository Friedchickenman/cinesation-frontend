// src/components/Header.tsx
import Link from "next/link";

export default function Header() {
    return (
        // sticky와 backdrop-blur를 써서 스크롤을 내려도 상단에 예쁘게 반투명하게 고정되게 만들었습니다!
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* 왼쪽 로고 영역 */}
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="text-2xl">🎬</span>
                    <span className="text-xl font-bold text-blue-600 tracking-tight">CineSation</span>
                </Link>

                {/* 오른쪽 로그인 버튼 영역 (나중에 구글 로그인 연결할 자리) */}
                <nav>
                    <button className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                        구글로 시작하기
                    </button>
                </nav>

            </div>
        </header>
    );
}