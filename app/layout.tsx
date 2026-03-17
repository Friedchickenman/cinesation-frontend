import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link"; // 클릭 시 메인으로 이동하기 위한 Next.js 링크 컴포넌트

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CineSation - 타임 리밋 무비 커뮤니티",
    description: "영화의 감동을 나누는 가장 완벽한 7일",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
        <body className={`${inter.className} bg-slate-50 text-slate-900`}>

        {/* 🌟 1. 공통 헤더 (네비게이션 바) */}
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* 왼쪽: 서비스 로고 */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-2xl transition-transform group-hover:scale-110">🎬</span>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Cine<span className="text-blue-600">Sation</span>
                </span>
                    </Link>

                    {/* 오른쪽: 구글 로그인 버튼 */}
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 hover:shadow transition-all font-semibold text-sm text-gray-700">
                            {/* 구글 로고 아이콘 (SVG) */}
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google로 시작하기
                        </button>
                    </div>

                </div>
            </div>
        </header>

        {/* 🌟 2. 메인 콘텐츠 (page.tsx나 다른 페이지들이 들어가는 자리) */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
        </main>

        </body>
        </html>
    );
}