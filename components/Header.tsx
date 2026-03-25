// src/components/Header.tsx
import Link from "next/link";
import AuthButton from "./AuthButton";

export default function Header() {
    return (
        // 🌟 배경과 테두리를 현재 다크 테마에 완벽히 맞춤
        <header className="sticky top-0 z-50 w-full bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-800 shadow-sm">
            <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">

                {/* 🌟 1. 촌스러운 이모지를 빼고 프리미엄 타이포그래피 + Live 레드닷(Red Dot) 적용 */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
                    </div>
                    <span className="text-xl font-black text-white tracking-tighter italic drop-shadow-sm group-hover:text-zinc-300 transition-colors">
                        CINESATION.
                    </span>
                </Link>

                {/* 🌟 2. 하드코딩된 버튼 대신 AuthButton 컴포넌트를 통합하여 상태(로그인/아웃) 반영 */}
                <nav>
                    <AuthButton />
                </nav>

            </div>
        </header>
    );
}