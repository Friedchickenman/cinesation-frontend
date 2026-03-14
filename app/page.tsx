"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newMovieId, setNewMovieId] = useState("");
    const [newTitle, setNewTitle] = useState("");

    // 예쁜 토스트 알림창을 위한 State
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // 토스트 띄우기 함수 (3초 뒤 자동 사라짐)
    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }; // 👈 성준님 코드에서 요 닫는 중괄호가 빠져있었네요!

    // 방 목록 불러오기 함수
    const loadRooms = () => {
        fetch("http://localhost:8080/api/rooms")
            .then((res) => {
                if (!res.ok) throw new Error("서버 응답 에러");
                return res.json();
            })
            .then((data) => setRooms(data))
            .catch((err) => setError(err.message));
    };

    useEffect(() => {
        loadRooms();
    }, []);

    // 방 개설 통신 함수
    const handleCreateRoom = async () => {
        if (!newMovieId.trim() || !newTitle.trim()) {
            showToast("영화 ID와 토론방 제목을 모두 입력해 주세요!", "error");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    movieId: newMovieId,
                    title: newTitle,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "방 생성에 실패했습니다.");
            }

            showToast("🎉 토론방이 성공적으로 개설되었습니다!", "success");
            setIsModalOpen(false);
            setNewMovieId("");
            setNewTitle("");
            loadRooms();

        } catch (err: any) {
            showToast(err.message, "error");
        }
    };

    return (
        <div className="flex flex-col gap-12 relative">

            {/* 🌟 1. 메인 배너 (Hero Section) */}
            <section className="relative w-full bg-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-purple-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-start gap-5">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold border border-blue-400/20">
            ⏳ 타임 리밋 무비 커뮤니티
          </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                        영화의 감동을 나누는 <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              가장 완벽한 7일
            </span>
                    </h1>
                    <p className="text-slate-300 text-lg max-w-xl">
                        방금 본 영화의 여운이 가시지 않나요? 같은 영화를 본 사람들과 7일 동안만 열리는 비밀스러운 공간에서 과몰입 토론을 시작해 보세요.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                    >
                        <span>+ 새 토론방 만들기</span>
                    </button>
                </div>
            </section>

            {/* 🌟 2. 넷플릭스 스타일 카드 UI 영역 */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        🔥 지금 뜨거운 토론방
                    </h2>
                    <span className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-800 transition-colors">
            전체 보기 →
          </span>
                </div>

                {error ? (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg">에러 발생: {error}</div>
                ) : rooms.length === 0 ? (
                    <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                        아직 만들어진 방이 없습니다. 첫 번째 토론방의 주인공이 되어보세요!
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {rooms.map((room: any) => (
                            <div
                                key={room.id}
                                onClick={() => router.push(`/rooms/${room.id}`)}
                                className="group relative flex flex-col bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2"
                            >
                                <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden flex items-center justify-center">
                                    <span className="text-slate-600 font-medium">포스터 준비중</span>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                                    <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-[11px] font-bold rounded-md shadow-sm">
                      OPEN
                    </span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col justify-end z-10">
                                        <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight mb-1 group-hover:text-blue-400 transition-colors">
                                            {room.title}
                                        </h3>
                                        <p className="text-xs text-gray-300 truncate">
                                            {room.movieId}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 🌟 3. 모달 창 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">새 토론방 만들기</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">영화 ID (임시)</label>
                                <input
                                    type="text"
                                    value={newMovieId}
                                    onChange={(e) => setNewMovieId(e.target.value)}
                                    placeholder="예: m_ironman_03"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">토론방 제목</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="토론하고 싶은 주제를 적어주세요!"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">취소</button>
                            <button
                                onClick={handleCreateRoom}
                                className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                            >
                                방 개설하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🌟 4. 토스트 알림창 */}
            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`px-6 py-3 rounded-full shadow-lg font-medium text-white flex items-center gap-2 ${
                        toast.type === "success" ? "bg-gray-800" : "bg-red-600"
                    }`}>
                        <span>{toast.type === "success" ? "🎉" : "🚨"}</span>
                        {toast.message}
                    </div>
                </div>
            )}

        </div>
    );
}