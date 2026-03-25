import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import Header from "@/components/Header"; // 🌟 방금 만든 프리미엄 다크 헤더를 불러옵니다.
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CINESATION. | 타임 리밋 무비 라운지",
    description: "영화의 감동을 나누는 가장 완벽한 7일",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" className={cn("font-sans", geist.variable)}>
        {/* 🌟 전체 배경을 시크한 다크 모드로 완벽 통합 */}
        <body className={`${inter.className} bg-[#09090B] text-zinc-100 antialiased selection:bg-zinc-800 selection:text-white`}>
        <Providers>
            {/* 🌟 지저분했던 하드코딩 헤더를 날리고, 깔끔하게 컴포넌트 1줄로 통합! */}
            <Header />

            <main className="w-full pb-8">
                {children}
            </main>
        </Providers>

        {/* 🌟 알림 팝업창(Toaster)도 다크 테마 적용 */}
        <Toaster position="bottom-right" richColors theme="dark" />
        </body>
        </html>
    );
}