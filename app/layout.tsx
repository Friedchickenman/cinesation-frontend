import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Providers from "./Providers";
import AuthButton from "@/components/AuthButton";
import { cn } from "@/lib/utils";

// 🌟 1. Sonner 알림창 임포트! (구형 toaster가 아닙니다)
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CineSation - 타임 리밋 무비 커뮤니티",
    description: "영화의 감동을 나누는 가장 완벽한 7일",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" className={cn("font-sans", geist.variable)}>
        <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <Providers>
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center gap-2 group">
                            <span className="text-2xl transition-transform group-hover:scale-110">🎬</span>
                            <span className="text-xl font-extrabold tracking-tight text-slate-900">
                                Cine<span className="text-blue-600">Sation</span>
                            </span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <AuthButton />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </Providers>

        {/* 🌟 2. body 끝나기 직전에 Sonner Toaster 추가! */}
        <Toaster position="bottom-right" richColors />

        </body>
        </html>
    );
}