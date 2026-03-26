"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl"; // 🌟 번역 훅

interface RoomMovieBannerProps {
    room: any;
    isLoading: boolean;
    error: string;
}

export default function RoomMovieBanner({ room, isLoading, error }: RoomMovieBannerProps) {
    const t = useTranslations("RoomDetail"); // 🌟 번역기

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
                        {room?.genres?.map((g: string) => (
                            <span key={g} className="px-3 py-1 bg-zinc-900/80 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-zinc-300 border border-zinc-700/50">{g}</span>
                        ))}
                        {room?.runtime && (
                            <span className="px-3 py-1 bg-zinc-900/80 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-zinc-300 border border-zinc-700/50">{room.runtime}분</span>
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