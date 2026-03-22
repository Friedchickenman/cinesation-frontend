import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
// 👇 새롭게 추가된 2줄! (Provider와 AuthButton 불러오기)
import Providers from "./Providers";
import AuthButton from "@/components/AuthButton";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
        <html lang="ko" className={cn("font-sans", geist.variable)}>
        <body className={`${inter.className} bg-slate-50 text-slate-900`}>

        {/* 🌟 핵심 포인트 1: Providers로 헤더와 메인 콘텐츠 전체를 감싸줍니다! */}
        <Providers>
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
                            {/* 🌟 핵심 포인트 2: 길었던 button 코드를 지우고 AuthButton 딱 하나로 대체! */}
                            <AuthButton />
                        </div>

                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </Providers>

        </body>
        </html>
    );
}