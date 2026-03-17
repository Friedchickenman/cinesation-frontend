"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newTitle, setNewTitle] = useState("");
    const [newMovieId, setNewMovieId] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<any>(null);

    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // 🌟 1. 방 목록을 불러올 때 TMDB 포스터도 같이 훔쳐(?)옵니다!
    const loadRooms = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/rooms");
            if (!res.ok) throw new Error("서버 응답 에러");
            const data = await res.json();

            // 👇 이 한 줄이 핵심입니다! 방 번호(id)가 큰 것(최신)부터 앞에 오도록 내림차순 정렬
            const sortedData = data.sort((a: any, b: any) => b.id - a.id);

            const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

            const roomsWithPosters = await Promise.all(
                sortedData.map(async (room: any) => { // 👈 여기도 data 대신 sortedData로 변경!
                    if (!room.movieId || room.movieId.startsWith("m_")) return room;

                    try {
                        const tmdbRes = await fetch(
                            `https://api.themoviedb.org/3/movie/${room.movieId}?language=ko-KR&api_key=${apiKey}`
                        );
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
            setError(err.message);
        }
    };

    useEffect(() => {
        loadRooms();
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
            const res = await fetch(
                `https://api.themoviedb.org/3/search/movie?query=${searchQuery}&language=ko-KR&api_key=${apiKey}`
            );
            const data = await res.json();
            setSearchResults(data.results || []);
        } catch (err) {
            console.error("TMDB 검색 에러:", err);
            showToast("영화 검색 중 오류가 발생했습니다.", "error");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMovie(null);
        setSearchQuery("");
        setSearchResults([]);
        setNewTitle("");
        setNewMovieId("");
    };

    const handleCreateRoom = async () => {
        if (!newMovieId || !newTitle.trim()) {
            showToast("영화와 토론방 제목을 모두 입력해 주세요!", "error");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    movieId: String(newMovieId),
                    title: newTitle,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "방 생성에 실패했습니다.");
            }

            showToast("🎉 토론방이 성공적으로 개설되었습니다!", "success");
            closeModal();
            loadRooms(); // 방 만들고 나서 목록(과 포스터) 다시 불러오기!
        } catch (err: any) {
            showToast(err.message, "error");
        }
    };

    return (
        <div className="flex flex-col gap-12 relative">
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

                                    {/* 🌟 2. 드디어 메인 카드에 넷플릭스 뺨치는 포스터가 뜹니다! */}
                                    {room.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w500${room.poster_path}`}
                                            alt={room.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <span className="text-slate-600 font-medium text-sm">포스터 없음</span>
                                    )}

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
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 모달 창 영역 (기존 코드와 동일) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
                            <h3 className="text-xl font-bold text-gray-900">
                                {selectedMovie ? "토론방 주제 정하기" : "영화 검색하기"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        </div>

                        <div className="p-5 overflow-y-auto">
                            {!selectedMovie ? (
                                <>
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="영화 제목을 검색해 보세요!"
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium transition-colors"
                                        >
                                            검색
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {searchResults.map((movie: any) => (
                                            <div
                                                key={movie.id}
                                                onClick={() => {
                                                    setSelectedMovie(movie);
                                                    setNewMovieId(movie.id);
                                                }}
                                                className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all"
                                            >
                                                <div className="w-12 h-16 bg-slate-200 rounded overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                                                    {movie.poster_path ? (
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                                            alt={movie.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-gray-400">이미지 없음</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 leading-tight">{movie.title}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {movie.release_date?.substring(0, 4)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {searchResults.length === 0 && searchQuery && (
                                            <div className="py-10 text-center text-gray-500">
                                                검색 결과가 없습니다. 다시 검색해 보세요!
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                                        <button
                                            onClick={() => { setSelectedMovie(null); setNewMovieId(""); }}
                                            className="absolute top-3 right-4 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            다른 영화 선택
                                        </button>
                                        <div className="w-16 h-24 bg-white rounded overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                                            {selectedMovie.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`}
                                                    alt={selectedMovie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400">No Image</span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-blue-600 mb-1 block tracking-wider">선택된 영화</span>
                                            <h4 className="font-bold text-lg text-gray-900 leading-tight">{selectedMovie.title}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{selectedMovie.release_date?.substring(0, 4)}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">어떤 주제로 토론할까요?</label>
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="예) 결말에 대한 여러분의 생각은?"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100 shrink-0">
                            <button onClick={closeModal} className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors">
                                취소
                            </button>
                            <button
                                onClick={handleCreateRoom}
                                disabled={!selectedMovie || !newTitle.trim()}
                                className={`px-6 py-2.5 text-white rounded-xl font-medium shadow-sm transition-all ${
                                    selectedMovie && newTitle.trim()
                                        ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                                        : 'bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                방 개설하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

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