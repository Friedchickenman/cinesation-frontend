"use client"; // 🌟 이 한 줄이 추가되었습니다!

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";

export default function AuthButton() {
    const { data: session } = useSession();

    if (session) {
        return (
            <div className="flex items-center gap-4">
                {session.user?.image ? (
                    <img src={session.user.image} alt={session.user?.name || "User Avatar"} className="w-9 h-9 rounded-full border border-zinc-700 shadow-sm" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 text-xs font-bold shadow-sm">
                        {session.user?.name?.substring(0, 1) || "?"}
                    </div>
                )}
                {/* 🌟 로그아웃 버튼: 헤더에 맞춰 monochrome 다크 */}
                <Button onClick={() => signOut()} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold rounded-lg px-4 h-9 text-xs border border-zinc-700 shadow-inner transition-colors">
                    로그아웃
                </Button>
            </div>
        );
    }

    return (
        // 🌟 로그인 버튼: 애플 바이브 + Vercel 블랙
        <Button onClick={() => signIn("google")} className="bg-white hover:bg-zinc-200 text-black font-bold rounded-lg px-5 h-9 text-xs border border-zinc-200 shadow-[0_2px_10px_rgb(255,255,255,0.1)] transition-all">
            로그인
        </Button>
    );
}