"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl"; // 🌟 번역 훅

interface RoomMovieBannerProps {
    room: any;
    isLoading: boolean;
    error: string;
}

export default function RoomMovieBanner({ room, isLoading, error }: RoomMovieBannerProps) {
    const t = useTranslations("RoomDetail"); // 🌟 번역기

    // 🌟 카운트다운 타이머를 위한 상태 (State) 추가
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isUrgent, setIsUrgent] = useState(false);

    // 🌟 실시간 타이머 계산 로직
    useEffect(() => {
        if (!room || room.status === 'CLOSED') return;

        // 방 생성일(createdAt) 기준으로 7일 뒤(타겟 타임)를 계산합니다.
        // (만약 백엔드에서 createdAt을 안 주면, 현재 시간 기준으로 작동하도록 임시 세팅)
        const createdDate = room.createdAt ? new Date(room.createdAt) : new Date();
        const targetDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        const timer = setInterval(() => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            // 시간이 다 지나면 종료 처리
            if (diff <= 0) {
                setTimeLeft(t('expired')); // "종료됨" 또는 "Expired"
                setIsUrgent(false);
                clearInterval(timer);
                return;
            }

            // 남은 일, 시간, 분, 초 계산
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / 1000 / 60) % 60);
            const secs = Math.floor((diff / 1000) % 60);

            // 포맷팅 (예: 6d 23:59:59)
            let timeString = '';
            if (days > 0) timeString += `${days}d `;
            timeString += `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            setTimeLeft(timeString);

            // 🌟 남은 시간이 24시간 미만(0일)이면 긴급(Urgent) 모드로 전환!
            setIsUrgent(days === 0);
        }, 1000);

        return () => clearInterval(timer);
    }, [room, t]);

    if (isLoading) {
        return (
            <div className="relative bg-zinc-900 rounded-[2rem] border border-zinc-800 overflow-hidden shadow-sm mb-8 h-[400px] flex items-center p-8 md:p-12">
                <Skeleton className="absolute inset-0 w-full h-full bg-zinc-800/50" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-950/30 border border-red-900/50 rounded-[2rem] p-8 text-red-400 shadow-sm mb-8 flex flex-col items-center justify-center text-center h-[200px]">
                <span className="text-4xl mb-4">🚨</span>
                <h2 className="text-xl font-bold mb-2 text-white">{t('errorTitle')}</h2>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative bg-[#09090B] border border-zinc-800/80 rounded-[2rem] text-white shadow-2xl mb-8 overflow-hidden min-h-[380px] p-8 md:p-12 flex items-center group">
            {room?.backdrop_path ? (
                <>
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-screen transition-opacity duration-1000 group-hover:opacity-30" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${room.backdrop_path})` }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#09090B] via-[#09090B]/90 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent" />
                </>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-[#09090B]" />
            )}

            <div className="relative z-10 w-full flex flex-col md:flex-row gap-8 items-center md:items-end">
                {room?.poster_path && (
                    <img
                        src={`https://image.tmdb.org/t/p/w500${room.poster_path}`}
                        alt={room.title}
                        className="w-36 md:w-48 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/10 shrink-0 transform transition-transform hover:scale-105"
                    />
                )}
                <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm border ${room?.status === 'OPEN' ? 'bg-[#00E676] text-black border-[#00E676]' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                            {room?.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                        </span>

                        {/* 🌟 여기에 1초마다 줄어드는 카운트다운 타이머가 들어갑니다! */}
                        {room?.status === 'OPEN' && timeLeft && (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border backdrop-blur-md shadow-sm transition-colors flex items-center gap-1.5 ${isUrgent ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-zinc-900/80 text-zinc-300 border-zinc-700/50'}`}>
                                ⏳ {t('timeLeft')} {timeLeft}
                            </span>
                        )}

                        {room?.genres?.map((g: string) => (
                            <span key={g} className="px-3 py-1 bg-zinc-900/80 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-zinc-300 border border-zinc-700/50">{g}</span>
                        ))}
                        {/* 🌟 수정 포인트: room.runtime 뒤에 t('min') 적용! */}
                        {room?.runtime && (
                            <span className="px-3 py-1 bg-zinc-900/80 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-zinc-300 border border-zinc-700/50">{room.runtime}{t('min')}</span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 leading-tight drop-shadow-md text-white">
                        {room?.real_movie_title || room?.movieId}
                        {room?.release_year && <span className="text-xl md:text-2xl font-medium text-zinc-500 ml-3">({room?.release_year})</span>}
                    </h1>

                    <p className="text-zinc-400 text-sm drop-shadow-sm mb-8 flex flex-col md:flex-row gap-2 md:gap-5 justify-center md:justify-start">
                        <span><span className="text-zinc-500 mr-2">{t('director')}</span> <span className="font-bold text-zinc-200">{room?.director}</span></span>
                        <span className="hidden md:inline text-zinc-700">|</span>
                        <span><span className="text-zinc-500 mr-2">{t('cast')}</span> <span className="font-bold text-zinc-200">{room?.cast}</span></span>
                    </p>

                    <div className="inline-flex flex-col items-start p-5 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-xl w-full max-w-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-white/20"></div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-white text-sm">👑</span>
                            <span className="text-zinc-400 text-[10px] font-black tracking-widest uppercase">{t('hostTopic')}{room?.creatorName}</span>
                        </div>
                        <p className="text-zinc-100 text-lg md:text-xl font-bold leading-relaxed break-keep">
                            "{room?.title}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}