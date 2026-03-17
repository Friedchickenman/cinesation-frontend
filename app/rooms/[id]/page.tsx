"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.id;
    const router = useRouter();
    const { data: session } = useSession();

    const [room, setRoom] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // 🌟 공유 버튼 상태 (복사 완료 피드백용)
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/rooms/${roomId}`);
                if (!res.ok) throw new Error("방 정보를 찾을 수 없거나 서버 에러입니다.");
                const roomData = await res.json();

                const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                if (roomData.movieId && !roomData.movieId.startsWith("m_")) {
                    const tmdbRes = await fetch(
                        `https://api.themoviedb.org/3/movie/${roomData.movieId}?language=ko-KR&api_key=${apiKey}`
                    );
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        roomData.poster_path = tmdbData.poster_path;
                        roomData.real_movie_title = tmdbData.title;
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

    // 🌟 URL 복사 함수
    const handleCopyLink = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // 2초 뒤에 다시 원래대로
        });
    };

    return (
        <div className="max-w-5xl mx-auto py-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6 px-2">
                <button
                    onClick={() => router.back()}
                    className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors"
                >
                    ← 메인으로 돌아가기
                </button>

                {/* 🌟 상세 페이지 공유 버튼 */}
                <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        isCopied
                            ? "bg-green-100 text-green-700 shadow-sm"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
                    }`}
                >
                    {isCopied ? (
                        <>
                            <span>✅</span> 복사 완료!
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            공유하기
                        </>
                    )}
                </button>
            </div>

            {isLoading ? (
                <div className="bg-slate-900 rounded-3xl p-12 flex justify-center items-center shadow-2xl mb-8 h-64">
                    <div className="text-white text-lg animate-pulse font-medium">데이터를 불러오는 중...🎬</div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-red-600 shadow-sm mb-8">
                    <h2 className="text-xl font-bold mb-2">🚨 앗, 문제가 발생했어요!</h2>
                    <p>{error}</p>
                </div>
            ) : (
                <div className="relative bg-slate-900 rounded-3xl text-white shadow-2xl mb-8 overflow-hidden min-h-[320px] flex flex-col justify-end p-8 md:p-12">
                    {room.poster_path && (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
                                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${room.poster_path})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                        </>
                    )}

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-blue-600 rounded-md text-xs font-black tracking-widest shadow-lg">OPEN</span>
                            <span className="text-slate-300 text-sm font-medium">No. {room.id}</span>
                            {/* 🌟 방장 이름 표시 추가 */}
                            <span className="text-blue-300/80 text-sm font-medium border-l border-white/20 pl-3">방장: {room.creatorName}</span>
                        </div>

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

            {!isLoading && !error && (
                <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <span>💬</span> 실시간 과몰입 채팅
                        </h3>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              접속 중
            </span>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 flex flex-col gap-5">
                        {/* ...채팅 더미 메시지 내용 (이전과 동일)... */}
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xl shrink-0">🤓</div>
                            <div>
                                <span className="text-xs font-semibold text-gray-500 mb-1.5 block ml-1">영화광기</span>
                                <div className="bg-white border border-gray-200 py-2.5 px-4 rounded-2xl rounded-tl-none text-gray-800 shadow-sm inline-block max-w-lg">
                                    다들 결말 어떻게 보셨어요?
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder={session ? "과몰입 멘트를 입력해 주세요..." : "로그인 후 참여 가능합니다."}
                                disabled={!session}
                                className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <button
                                disabled={!session}
                                className="px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                전송
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}