"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.id;
    const router = useRouter();

    // 👇 백엔드에서 가져온 특정 방 1개의 데이터를 담을 State
    const [room, setRoom] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // 👇 화면에 들어오자마자 딱 1번 실행되는 함수
    useEffect(() => {
        // 8080 서버에 '특정 방 번호'의 데이터를 달라고 요청합니다.
        fetch(`http://localhost:8080/api/rooms/${roomId}`)
            .then((res) => {
                if (!res.ok) throw new Error("방 정보를 찾을 수 없거나 서버 에러입니다.");
                return res.json();
            })
            .then((data) => {
                setRoom(data);
                setIsLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setIsLoading(false);
            });
    }, [roomId]);

    return (
        <div className="max-w-4xl mx-auto py-10 animate-in fade-in duration-500">
            <button
                onClick={() => router.back()}
                className="mb-6 text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
                ← 목록으로 돌아가기
            </button>

            {/* 로딩 중일 때 보여줄 화면 */}
            {isLoading ? (
                <div className="bg-slate-900 rounded-2xl p-12 flex justify-center items-center shadow-lg mb-8 h-48">
                    <div className="text-white text-lg animate-pulse">데이터를 불러오는 중입니다... 🎬</div>
                </div>
            ) : error ? (
                // 에러가 났을 때 보여줄 화면
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-red-600 shadow-sm mb-8">
                    <h2 className="text-xl font-bold mb-2">🚨 앗, 문제가 발생했어요!</h2>
                    <p>{error}</p>
                </div>
            ) : (
                // 👇 데이터가 성공적으로 도착했을 때 보여줄 진짜 화면! (방 제목, 영화 ID 적용)
                <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
                    {/* 장식용 빛 효과 */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-2.5 py-1 bg-blue-600 rounded-md text-xs font-bold tracking-wide">OPEN</span>
                            <span className="text-slate-400 text-sm">No. {room.id}</span>
                            <span className="text-slate-500 text-sm">|</span>
                            <span className="text-slate-400 text-sm font-medium">영화: {room.movieId}</span>
                        </div>
                        {/* 백엔드에서 가져온 진짜 방 제목을 출력! */}
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                            {room.title}
                        </h1>
                        <p className="text-slate-300">
                            이곳은 영화 <span className="text-blue-300 font-semibold">{room.movieId}</span>에 대해 과몰입 토론을 나누는 공간입니다.
                        </p>
                    </div>
                </div>
            )}

            {/* 임시 채팅 UI 영역 */}
            <div className="h-96 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                    💬
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    채팅 기능이 곧 추가될 예정입니다!
                </h3>
                <p className="text-gray-500 max-w-sm">
                    나중에 여기에 Redis와 WebSocket을 붙여서 끊김 없는 실시간 채팅을 구현할 거예요.
                </p>
            </div>
        </div>
    );
}