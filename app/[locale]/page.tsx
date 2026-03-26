"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// 🌟 1. 다국어 처리를 위한 훅 임포트
import { useLocale, useTranslations } from "next-intl";

import HeroSection from "@/components/home/HeroSection";
import LoungeBoard from "@/components/home/LoungeBoard";
import CreateRoomModal from "@/components/home/CreateRoomModal";

export default function Home() {
    const { data: session } = useSession();

    // 🌟 2. 언어 및 번역기 장착
    const locale = useLocale();
    const tmdbLang = locale === 'en' ? 'en-US' : 'ko-KR'; // TMDB API용 언어 파라미터
    const t = useTranslations("LoginModal");

    // 전역 데이터 상태 관리
    const [rooms, setRooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myRooms, setMyRooms] = useState<any[]>([]);
    const [isMyRoomsLoading, setIsMyRoomsLoading] = useState(false);

    // 모달 렌더링 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const loadRooms = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/rooms");
            if (!res.ok) throw new Error("서버 응답 에러");
            const data = await res.json();

            const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
            const roomsWithPosters = await Promise.all(
                data.map(async (room: any) => {
                    if (!room.movieId || room.movieId.startsWith("m_")) return room;
                    try {
                        // 🌟 3. 하드코딩된 ko-KR 대신 tmdbLang 변수 사용
                        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${room.movieId}?language=${tmdbLang}&api_key=${apiKey}`);
                        if (!tmdbRes.ok) return room;
                        const tmdbData = await tmdbRes.json();
                        return { ...room, poster_path: tmdbData.poster_path };
                    } catch (e) {
                        return room;
                    }
                })
            );
            setRooms(roomsWithPosters as any);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMyRooms = async () => {
        if (!session?.user?.name) return;
        setIsMyRoomsLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/rooms/my-rooms?creatorName=${encodeURIComponent(session.user.name)}`);
            if (!res.ok) throw new Error("내 기록을 불러오지 못했습니다.");
            const data = await res.json();

            const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
            const roomsWithPosters = await Promise.all(
                data.map(async (room: any) => {
                    if (!room.movieId || room.movieId.startsWith("m_")) return room;
                    try {
                        // 🌟 4. 하드코딩된 ko-KR 대신 tmdbLang 변수 사용
                        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${room.movieId}?language=${tmdbLang}&api_key=${apiKey}`);
                        if (!tmdbRes.ok) return room;
                        const tmdbData = await tmdbRes.json();
                        return { ...room, poster_path: tmdbData.poster_path };
                    } catch (e) {
                        return room;
                    }
                })
            );
            setMyRooms(roomsWithPosters as any);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsMyRoomsLoading(false);
        }
    };

    // 🌟 5. 의존성 배열에 locale을 추가해서 언어가 바뀌면 포스터도 새로 불러오도록 설정!
    useEffect(() => { loadRooms(); }, [locale]);
    useEffect(() => { if (session?.user?.name) loadMyRooms(); }, [session?.user?.name, locale]);

    return (
        <div className="flex flex-col gap-8 min-h-screen bg-[#09090B] text-zinc-100 px-4 md:px-8 pb-24 font-sans selection:bg-zinc-800 selection:text-white antialiased">

            {/* 1. 상단 배너 컴포넌트 */}
            <HeroSection
                onOpenModal={() => session ? setIsModalOpen(true) : setIsLoginModalOpen(true)}
            />

            {/* 2. 대시보드 및 카드 리스트 컴포넌트 */}
            <LoungeBoard
                rooms={rooms}
                myRooms={myRooms}
                isLoading={isLoading}
                isMyRoomsLoading={isMyRoomsLoading}
                session={session}
                onRequireLogin={() => setIsLoginModalOpen(true)}
            />

            {/* 3. 방 생성 모달 컴포넌트 */}
            <CreateRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { loadRooms(); if(session) loadMyRooms(); }}
                session={session}
            />

            {/* 로그인 유도 모달 */}
            <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
                <DialogContent className="sm:max-w-sm bg-zinc-900 border border-zinc-800 p-10 text-center flex flex-col items-center shadow-2xl rounded-[2rem] text-zinc-100">
                    <div className="w-16 h-16 bg-zinc-950 rounded-full flex items-center justify-center mb-6 text-3xl border border-zinc-800 shadow-sm animate-pulse">🎬</div>
                    <DialogTitle className="text-2xl font-black text-white mb-2.5 tracking-tight uppercase">
                        {t('title')}
                    </DialogTitle>
                    <p className="text-zinc-400 mb-8 font-medium text-xs leading-relaxed max-w-xs">
                        {t('desc1')}<br/>{t('desc2')}
                    </p>
                    <Button variant="outline" className="w-full h-12 flex justify-center items-center gap-2.5 font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl border-zinc-700 shadow-sm transition-all mb-3 text-xs" onClick={() => signIn("google")}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        {t('googleBtn')}
                    </Button>
                    <Button variant="ghost" className="text-zinc-500 hover:text-white hover:bg-zinc-800 text-xs font-semibold rounded-xl" onClick={() => setIsLoginModalOpen(false)}>
                        {t('closeBtn')}
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}