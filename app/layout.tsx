import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 👇 1. 방금 만든 Header 컴포넌트를 불러옵니다! (src가 없으니 @/components 로 바로 접근)
import Header from "@/components/Header";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// 👇 2. 브라우저 탭에 뜨는 사이트 제목과 설명을 바꿔줍니다.
export const metadata: Metadata = {
    title: "CineSation - 영화 토론 커뮤니티",
    description: "영화의 여운이 사라지기 전, 7일간의 기록",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // 👇 3. 한국어(ko) 설정으로 변경합니다.
        <html lang="ko">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
        >
        {/* 👇 4. 모든 화면의 맨 위에 헤더를 고정시킵니다! */}
        <Header />

        {/* 👇 5. 메인 컨텐츠(page.tsx 내용)가 너무 양옆으로 퍼지지 않게 가운데 정렬과 여백을 줍니다. */}
        <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
        </main>
        </body>
        </html>
    );
}