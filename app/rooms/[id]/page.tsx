"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.id;
    const router = useRouter();

    const [room, setRoom] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                // 1. 백엔드에서 방 정보 1개 가져오기
                const res = await fetch(`http://localhost:8080/api/rooms/${roomId}`);
                if (!res.ok) throw new Error("방 정보를 찾을 수 없거나 서버 에러입니다.");
                const roomData = await res.json();

                // 2. TMDB에서 영화 포스터랑 진짜 영화 제목 가져오기
                const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                if (roomData.movieId && !roomData.movieId.startsWith("m_")) {
                    const tmdbRes = await fetch(
                        `https://api.themoviedb.org/3/movie/${roomData.movieId}?language=ko-KR&api_key=${apiKey}`
                    );
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        roomData.poster_path = tmdbData.poster_path; // 포스터 이미지
                        roomData.real_movie_title = tmdbData.title;  // 진짜 영화 제목
                    }
                }

                setRoom(roomData);
                setIsLoading(false);
            } catch (err: any) {
                setError(err.message);
                setIsLoading(false);
            }
        };

        fetchRoomData();
    }, [roomId]);

    return (
        <div className="max-w-5xl mx-auto py-8 animate-in fade-in duration-500">
            <button
                onClick={() => router.back()}
                className="mb-6 text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors px-2"
            >
                ← 메인으로 돌아가기
            </button>

            {isLoading ? (
                <div className="bg-slate-900 rounded-3xl p-12 flex justify-center items-center shadow-2xl mb-8 h-64">
                    <div className="text-white text-lg animate-pulse font-medium">영화 데이터를 불러오는 중입니다... 🎬</div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-red-600 shadow-sm mb-8">
                    <h2 className="text-xl font-bold mb-2">🚨 앗, 문제가 발생했어요!</h2>
                    <p>{error}</p>
                </div>
            ) : (
                // 🌟 포스터가 배경으로 깔리는 새로운 헤더 디자인!
                <div className="relative bg-slate-900 rounded-3xl text-white shadow-2xl mb-8 overflow-hidden min-h-[320px] flex flex-col justify-end p-8 md:p-12">

                    {/* TMDB 포스터 배경 이미지 (어둡게 처리) */}
                    {room.poster_path && (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
                                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${room.poster_path})` }}
                            />
                            {/* 아래쪽으로 갈수록 어두워지는 그라데이션 */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                        </>
                    )}

                    {/* 장식용 빛 효과 (포스터가 없을 때를 대비) */}
                    {!room.poster_path && (
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                    )}

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-blue-600 rounded-md text-xs font-black tracking-widest shadow-lg">OPEN</span>
                            <span className="text-slate-300 text-sm font-medium">Room No. {room.id}</span>
                        </div>

                        {/* 방 제목 */}
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight drop-shadow-lg">
                            {room.title}
                        </h1>

                        <p className="text-slate-200 text-lg md:text-xl font-medium drop-shadow-md">
              <span className="text-blue-400 font-bold border-b border-blue-400/30 pb-0.5">
                {room.real_movie_title || room.movieId}
              </span>
                            에 대한 과몰입 토론방
                        </p>
                    </div>
                </div>
            )}

            {/* 임시 채팅 UI 영역 */}
            <div className="h-[500px] bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 text-3xl shadow-inner border border-gray-100">
                    💬
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight">
                    채팅 기능이 곧 추가될 예정입니다!
                </h3>
                <p className="text-gray-500 max-w-md leading-relaxed">
                    나중에 여기에 Redis와 WebSocket을 붙여서 7일 동안만 열리는 끊김 없는 실시간 채팅을 구현할 거예요.
                </p>
            </div>
        </div>
    );
}