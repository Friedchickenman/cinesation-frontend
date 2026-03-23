"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function Home() {
    const router = useRouter();
    const { data: session } = useSession();

    const [rooms, setRooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [myRooms, setMyRooms] = useState<any[]>([]);
    const [isMyRoomsLoading, setIsMyRoomsLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newMovieId, setNewMovieId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<any>(null);

    const [filterStatus, setFilterStatus] = useState("ALL");
    const [sortBy, setSortBy] = useState("LATEST");

    const formatLastMessageTime = (timeStr: string) => {
        if (!timeStr) return "";
        try {
            const date = new Date(timeStr);
            if (isNaN(date.getTime())) return timeStr;
            return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return timeStr;
        }
    };

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
                        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${room.movieId}?language=ko-KR&api_key=${apiKey}`);
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
                        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${room.movieId}?language=ko-KR&api_key=${apiKey}`);
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

    useEffect(() => {
        loadRooms();
    }, []);

    useEffect(() => {
        if (session?.user?.name) {
            loadMyRooms();
        }
    }, [session?.user?.name]);

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
            toast.error("영화 검색 중 오류가 발생했습니다.");
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
            toast.warning("영화와 토론방 제목을 모두 입력해 주세요!");
            return;
        }
        try {
            const response = await fetch("http://localhost:8080/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    movieId: String(newMovieId),
                    title: newTitle,
                    creatorName: session?.user?.name || "익명 유저",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "방 생성에 실패했습니다.");
            }

            toast.success("🎉 토론방이 성공적으로 개설되었습니다!");
            closeModal();
            loadRooms();
            if (session?.user?.name) loadMyRooms();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleOpenModal = () => {
        if (!session) {
            setIsLoginModalOpen(true);
            return;
        }
        setIsModalOpen(true);
    };

    // 🌟 핵심 로직: 탭 종류(activeTab)에 따라 필터링 철학을 다르게 적용합니다.
    const getProcessedRooms = (roomList: any[], activeTab: string) => {
        let processed = [...roomList];

        if (activeTab === "all") {
            // [전체 방] 탭: 기본적으로 OPEN만 노출 (필터 선택 시 해당 상태 노출)
            processed = processed.filter((room) => {
                if (filterStatus === "ALL") return room.status === "OPEN";
                return room.status === filterStatus;
            });
        } else {
            // [내 기록] 탭: 필터와 상관없이 본인의 모든 기록 노출 (기본값 ALL일 때)
            processed = processed.filter((room) => {
                if (filterStatus === "ALL") return true;
                return room.status === filterStatus;
            });
        }

        processed.sort((a, b) => {
            if (sortBy === "LATEST") return b.id - a.id;
            if (sortBy === "OLDEST") return a.id - b.id;
            if (sortBy === "ACTIVE") {
                const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                return timeB - timeA;
            }
            return 0;
        });

        return processed;
    };

    const renderRoomCards = (roomList: any[], emptyMessage: string, activeTab: string) => {
        // 🌟 탭 종류(activeTab)를 넘겨줘서 필터링 방식을 결정합니다.
        const processedRooms = getProcessedRooms(roomList, activeTab);

        if (processedRooms.length === 0) {
            return (
                <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <span className="text-4xl mb-4">🎬</span>
                    <p className="text-gray-500 font-medium">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {processedRooms.map((room: any) => (
                    <div key={room.id} onClick={() => router.push(`/rooms/${room.id}`)} className="group relative flex flex-col bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2">
                        <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden flex items-center justify-center">
                            {room.poster_path ? (
                                <img src={`https://image.tmdb.org/t/p/w500${room.poster_path}`} alt={room.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <span className="text-slate-600 font-medium text-sm">포스터 없음</span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                            <div className="absolute top-3 left-3 z-10 flex gap-1.5">
                                <span className={`px-2.5 py-1 backdrop-blur-sm text-white text-[11px] font-bold rounded-md shadow-sm ${room.status === 'OPEN' ? 'bg-blue-600/90' : 'bg-red-600/90'}`}>
                                    {room.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                                </span>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col justify-end z-10">
                                <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight mb-3 group-hover:text-blue-400 transition-colors">{room.title}</h3>
                                <div className="flex flex-col gap-1 border-t border-white/20 pt-3">
                                    <p className="text-xs text-slate-300 line-clamp-1 flex items-center gap-1.5">
                                        <span className="text-blue-400 shrink-0">💬</span>
                                        <span className="truncate">{room.lastMessage || "아직 대화가 없습니다"}</span>
                                    </p>
                                    {room.lastMessageTime && (
                                        <span className="text-[10px] text-slate-400 pl-5">{formatLastMessageTime(room.lastMessageTime)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
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
                    <Button size="lg" className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30" onClick={handleOpenModal}>
                        + 새 토론방 만들기
                    </Button>
                </div>
            </section>

            <section>
                <Tabs defaultValue="all" className="w-full">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            🔥 토론방 라운지
                        </h2>
                        <TabsList className="bg-slate-200/50 p-1.5 rounded-xl h-auto">
                            <TabsTrigger value="all" className="rounded-lg font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-6 py-2.5 transition-all">전체 방 보기</TabsTrigger>
                            <TabsTrigger value="my" className="rounded-lg font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-6 py-2.5 transition-all">나의 과몰입 기록</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 mb-6 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[140px] bg-gray-50 border-gray-200 focus:ring-blue-500 rounded-xl font-semibold text-gray-700">
                                <SelectValue placeholder="상태 필터" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="ALL" className="font-medium cursor-pointer">모든 상태</SelectItem>
                                <SelectItem value="OPEN" className="font-medium cursor-pointer text-blue-600">입장 가능 (OPEN)</SelectItem>
                                <SelectItem value="CLOSED" className="font-medium cursor-pointer text-red-600">종료됨 (CLOSED)</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[140px] bg-gray-50 border-gray-200 focus:ring-blue-500 rounded-xl font-semibold text-gray-700">
                                <SelectValue placeholder="정렬 기준" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="LATEST" className="font-medium cursor-pointer">최신 개설순</SelectItem>
                                <SelectItem value="OLDEST" className="font-medium cursor-pointer">오래된 순</SelectItem>
                                <SelectItem value="ACTIVE" className="font-medium cursor-pointer text-green-600">🔥 최근 대화순</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 🌟 탭을 부를 때 "all" 인지 "my" 인지 넘겨줍니다! */}
                    <TabsContent value="all" className="mt-0 animate-in fade-in duration-500">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="flex flex-col gap-3">
                                        <Skeleton className="aspect-[2/3] w-full rounded-2xl bg-slate-200" />
                                        <Skeleton className="h-5 w-3/4 bg-slate-200" />
                                        <Skeleton className="h-4 w-1/2 bg-slate-200" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-100 text-red-700 rounded-lg">에러 발생: {error}</div>
                        ) : (
                            renderRoomCards(rooms, "아직 만들어진 방이 없습니다.", "all")
                        )}
                    </TabsContent>

                    <TabsContent value="my" className="mt-0 animate-in fade-in duration-500">
                        {!session ? (
                            <div className="py-24 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <span className="text-5xl mb-4">🔒</span>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">로그인이 필요합니다</h3>
                                <p className="text-gray-500 font-medium mb-6">나만의 영화 다이어리를 만들고 과몰입 기록을 보관해 보세요!</p>
                                <Button onClick={() => setIsLoginModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8">
                                    로그인하기
                                </Button>
                            </div>
                        ) : isMyRoomsLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex flex-col gap-3">
                                        <Skeleton className="aspect-[2/3] w-full rounded-2xl bg-slate-200" />
                                        <Skeleton className="h-5 w-3/4 bg-slate-200" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            renderRoomCards(myRooms, "아직 개설한 토론방이 없습니다.", "my")
                        )}
                    </TabsContent>
                </Tabs>
            </section>

            <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) closeModal(); }}>
                <DialogContent className="sm:max-w-lg bg-white overflow-hidden max-h-[85vh] flex flex-col p-0">
                    <DialogHeader className="p-5 border-b border-gray-100 shrink-0">
                        <DialogTitle className="text-xl font-bold">{selectedMovie ? "토론방 주제 정하기" : "영화 검색하기"}</DialogTitle>
                    </DialogHeader>

                    <div className="p-5 overflow-y-auto">
                        {!selectedMovie ? (
                            <>
                                <div className="flex gap-2 mb-4">
                                    <Input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="영화 제목을 검색해 보세요!" className="flex-1" />
                                    <Button onClick={handleSearch} className="bg-slate-800 hover:bg-slate-700">검색</Button>
                                </div>
                                <div className="space-y-2">
                                    {searchResults.map((movie: any) => (
                                        <div key={movie.id} onClick={() => { setSelectedMovie(movie); setNewMovieId(movie.id); }} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all">
                                            <div className="w-12 h-16 bg-slate-200 rounded flex items-center justify-center shrink-0">
                                                {movie.poster_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover rounded" />
                                                ) : <span className="text-[10px] text-gray-400">이미지 없음</span>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 leading-tight">{movie.title}</h4>
                                                <p className="text-sm text-gray-500 mt-1">{movie.release_date?.substring(0, 4)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                                    <button onClick={() => { setSelectedMovie(null); setNewMovieId(""); }} className="absolute top-3 right-4 text-xs font-semibold text-blue-600">다른 영화 선택</button>
                                    <div className="w-16 h-24 bg-white rounded flex items-center justify-center shrink-0 border border-slate-200">
                                        {selectedMovie.poster_path ? (
                                            <img src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`} alt={selectedMovie.title} className="w-full h-full object-cover rounded" />
                                        ) : <span className="text-[10px] text-gray-400">No Image</span>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{selectedMovie.title}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{selectedMovie.release_date?.substring(0, 4)}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">어떤 주제로 토론할까요?</label>
                                    <Input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="예) 결말에 대한 여러분의 생각은?" />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-5 bg-gray-50 border-t border-gray-100 shrink-0">
                        <Button variant="outline" onClick={closeModal}>취소</Button>
                        <Button onClick={handleCreateRoom} disabled={!selectedMovie || !newTitle.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">방 개설하기</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
                <DialogContent className="sm:max-w-sm bg-white p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5 text-3xl shadow-sm border border-blue-100">🔒</div>
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</DialogTitle>
                    <p className="text-gray-500 mb-8 leading-relaxed">과몰입 토론방을 개설하려면<br />먼저 안전하게 로그인을 해주세요!</p>
                    <Button variant="outline" className="w-full h-12 flex justify-center items-center gap-2.5 font-bold text-gray-700 mb-3" onClick={() => signIn("google")}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google로 계속하기
                    </Button>
                    <Button variant="ghost" className="w-full h-12 text-gray-500" onClick={() => setIsLoginModalOpen(false)}>닫기</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}