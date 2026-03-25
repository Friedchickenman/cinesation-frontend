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

    const getProcessedRooms = (roomList: any[], activeTab: string) => {
        let processed = [...roomList];

        if (activeTab === "all") {
            processed = processed.filter((room) => {
                if (filterStatus === "ALL") return room.status === "OPEN";
                return room.status === filterStatus;
            });
        } else {
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
        const processedRooms = getProcessedRooms(roomList, activeTab);

        if (processedRooms.length === 0) {
            return (
                <div className="py-24 text-center flex flex-col items-center justify-center bg-zinc-900/50 rounded-[2rem] border border-zinc-800 shadow-sm mt-4">
                    <p className="text-zinc-500 font-medium text-sm">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 mt-6">
                {processedRooms.map((room: any) => (
                    <div key={room.id} onClick={() => router.push(`/rooms/${room.id}`)} className="group flex flex-col bg-zinc-900/80 rounded-2xl border border-zinc-800/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:border-zinc-700 transition-all duration-300 cursor-pointer p-2 hover:-translate-y-1">

                        <div className="relative aspect-[2/3] bg-zinc-950 rounded-xl overflow-hidden mb-3 border border-zinc-800">
                            {room.poster_path ? (
                                <img src={`https://image.tmdb.org/t/p/w500${room.poster_path}`} alt={room.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                            ) : (
                                <span className="text-zinc-700 font-semibold text-[10px] tracking-widest flex items-center justify-center w-full h-full">NO POSTER</span>
                            )}

                            <div className="absolute top-2 left-2 z-10">
                                <span className={`px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-full border shadow-sm backdrop-blur-md ${room.status === 'OPEN' ? 'bg-[#00E676] text-black border-[#00E676]' : 'bg-zinc-800/90 text-zinc-400 border-zinc-700'}`}>
                                    {room.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                                </span>
                            </div>
                        </div>

                        <div className="px-2 pb-1 flex flex-col flex-1">
                            <h3 className="text-[14px] font-bold text-zinc-100 line-clamp-2 leading-tight mb-2 group-hover:text-white transition-colors">{room.title}</h3>
                            <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-800/50">
                                <p className="text-[11px] text-zinc-500 font-medium line-clamp-1 flex items-center gap-1.5">
                                    <span className="opacity-70">💬</span>
                                    <span className="truncate">{room.lastMessage || "대화가 없습니다"}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 min-h-screen bg-[#09090B] text-zinc-100 px-4 md:px-8 pb-24 font-sans selection:bg-zinc-800 selection:text-white antialiased">

            <section className="relative w-full py-20 md:py-28 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-sm text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-6 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
                    Time-Limited Lounge
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tighter leading-[1.1] mb-5 drop-shadow-lg italic">
                    CINESATION.
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl font-medium leading-relaxed max-w-lg mb-10">
                    영화의 여운, 가슴 벅찬 감동.<br className="hidden md:block"/> 단 7일 동안 열리는 비밀스러운 과몰입 라운지.
                </p>

                <Button className="bg-white hover:bg-zinc-200 text-black font-extrabold text-xs tracking-widest uppercase px-10 py-7 rounded-full shadow-[0_4px_30px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_4px_40px_rgba(255,255,255,0.25)] hover:-translate-y-1" onClick={handleOpenModal}>
                    Create Lounge
                </Button>
            </section>

            <section className="relative z-10 w-full max-w-[1400px] mx-auto">
                <Tabs defaultValue="all" className="w-full">

                    {/* 🌟 개선된 애플/토스 스타일의 캡슐(Pill) 형태 라운지 컨트롤 패널 */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-6 bg-zinc-900/40 p-2 md:p-3 rounded-[2rem] border border-zinc-800/60 shadow-sm backdrop-blur-md">

                        <TabsList className="bg-zinc-950/60 p-1.5 h-auto gap-2 rounded-full w-full md:w-auto border border-zinc-800/80 shadow-inner">
                            <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2.5 font-bold text-xs text-zinc-500 transition-all uppercase tracking-widest flex-1 md:flex-none">
                                All Lounge
                            </TabsTrigger>
                            <TabsTrigger value="my" className="rounded-full data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2.5 font-bold text-xs text-zinc-500 transition-all uppercase tracking-widest flex-1 md:flex-none">
                                My Archive
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-3 w-full md:w-auto px-2 md:px-0">
                            {/* 🌟 필터 및 정렬 버튼도 캡슐 탭과 어울리게 둥글게(rounded-full) 매칭 */}
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full md:w-[130px] bg-zinc-950/60 border-zinc-800/80 rounded-full h-11 text-xs font-bold uppercase tracking-widest text-zinc-400 focus:ring-0 shadow-inner hover:bg-zinc-900 transition-colors">
                                    <SelectValue placeholder="STATUS" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl text-zinc-300 shadow-xl">
                                    <SelectItem value="ALL" className="text-xs font-bold">ALL</SelectItem>
                                    <SelectItem value="OPEN" className="text-[#00E676] font-bold text-xs">OPEN</SelectItem>
                                    <SelectItem value="CLOSED" className="font-bold text-xs text-zinc-500">CLOSED</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full md:w-[130px] bg-zinc-950/60 border-zinc-800/80 rounded-full h-11 text-xs font-bold uppercase tracking-widest text-zinc-400 focus:ring-0 shadow-inner hover:bg-zinc-900 transition-colors">
                                    <SelectValue placeholder="SORT" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl text-zinc-300 shadow-xl">
                                    <SelectItem value="LATEST" className="text-xs font-bold">LATEST</SelectItem>
                                    <SelectItem value="OLDEST" className="text-xs font-bold">OLDEST</SelectItem>
                                    <SelectItem value="ACTIVE" className="text-blue-400 font-bold text-xs">🔥 ACTIVE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <TabsContent value="all" className="mt-0 outline-none">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 mt-6">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="flex flex-col bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
                                        <Skeleton className="aspect-[2/3] w-full rounded-xl bg-zinc-800 mb-3" />
                                        <Skeleton className="h-4 w-3/4 bg-zinc-800 rounded-md ml-2" />
                                        <Skeleton className="h-3 w-1/2 bg-zinc-800/50 rounded-md mt-2 ml-2 mb-1" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="py-20 text-center text-red-400 font-medium text-sm">{error}</div>
                        ) : (
                            renderRoomCards(rooms, "조회된 라운지가 없습니다. 첫 방을 만들어보세요!", "all")
                        )}
                    </TabsContent>

                    <TabsContent value="my" className="mt-0 outline-none">
                        {!session ? (
                            <div className="py-24 text-center flex flex-col items-center justify-center bg-zinc-900/50 rounded-[2rem] border border-zinc-800 shadow-sm mt-4">
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-5 text-4xl border border-zinc-800">🔒</div>
                                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">로그인이 필요합니다</h3>
                                <p className="text-zinc-400 font-medium mb-8 text-base">나만의 과몰입 기록을 보관하고 확인하세요.</p>
                                <Button onClick={() => setIsLoginModalOpen(true)} className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-full px-8 py-6 shadow-md text-sm">
                                    구글 계정으로 시작
                                </Button>
                            </div>
                        ) : isMyRoomsLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 mt-6">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex flex-col bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
                                        <Skeleton className="aspect-[2/3] w-full rounded-xl bg-zinc-800 mb-3" />
                                        <Skeleton className="h-4 w-3/4 bg-zinc-800 rounded-md ml-2 mb-2" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            renderRoomCards(myRooms, "아직 참여한 토론 기록이 없습니다.", "my")
                        )}
                    </TabsContent>
                </Tabs>
            </section>

            {/* 🌟 시크한 다크 모달 */}
            <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) closeModal(); }}>
                <DialogContent className="sm:max-w-xl bg-zinc-900 border border-zinc-800 overflow-hidden max-h-[85vh] flex flex-col p-0 shadow-2xl rounded-[1.5rem] text-zinc-100 selection:bg-[#00E676]/50">
                    <DialogHeader className="p-6 border-b border-zinc-800 bg-zinc-950/50 shrink-0 text-center">
                        <DialogTitle className="text-lg font-bold text-white uppercase tracking-wider">{selectedMovie ? "Set Topic" : "Search Movie"}</DialogTitle>
                    </DialogHeader>

                    <div className="p-6 overflow-y-auto bg-zinc-950/20">
                        {!selectedMovie ? (
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-2 relative">
                                    <Input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="영화 제목 검색..." className="flex-1 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-0 rounded-xl h-12 px-4 text-sm font-medium shadow-inner" />
                                    <Button onClick={handleSearch} className="bg-white hover:bg-zinc-200 text-black h-12 px-6 rounded-xl font-bold text-xs shadow-md">검색</Button>
                                </div>
                                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                    {searchResults.map((movie: any) => (
                                        <div key={movie.id} onClick={() => { setSelectedMovie(movie); setNewMovieId(movie.id); }} className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-900/50 border border-transparent hover:border-zinc-800 hover:bg-zinc-900/80 cursor-pointer transition-all">
                                            <div className="w-12 h-16 bg-zinc-950 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-zinc-800 shadow-sm">
                                                {movie.poster_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover" />
                                                ) : <span className="text-[10px] text-zinc-600 font-semibold">NO IMG</span>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-base leading-tight group-hover:underline">{movie.title}</h4>
                                                <p className="text-xs text-zinc-500 mt-1">{movie.release_date?.substring(0, 4) || '-'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-start gap-5 relative p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm">
                                    <button onClick={() => { setSelectedMovie(null); setNewMovieId(""); }} className="absolute top-4 right-4 text-[11px] font-semibold text-zinc-500 hover:text-white transition-colors underline underline-offset-4 tracking-tight">변경</button>
                                    <div className="w-20 aspect-[2/3] bg-zinc-950 shrink-0 overflow-hidden rounded-xl border border-zinc-800">
                                        {selectedMovie.poster_path ? (
                                            <img src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`} alt={selectedMovie.title} className="w-full h-full object-cover" />
                                        ) : <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 font-semibold">NO IMG</div>}
                                    </div>
                                    <div className="flex-1 pt-1 pr-6">
                                        <h4 className="font-extrabold text-xl text-white leading-tight mb-1">{selectedMovie.title}</h4>
                                        <p className="text-xs text-zinc-400 font-medium">{selectedMovie.release_date?.substring(0, 4)}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 mb-2.5 ml-1 uppercase tracking-wider">토론 주제 (Topic)</label>
                                    <Input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="명확한 주제를 입력하세요." className="bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700 focus:ring-0 rounded-xl h-12 px-4 text-sm font-medium shadow-inner" />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-5 bg-zinc-900 border-t border-zinc-800 shrink-0 flex justify-end gap-2.5">
                        <Button variant="ghost" onClick={closeModal} className="text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl text-xs font-bold px-6 h-11 transition-colors">취소</Button>
                        <Button onClick={handleCreateRoom} disabled={!selectedMovie || !newTitle.trim()} className="bg-white hover:bg-zinc-200 text-black rounded-xl font-bold px-7 h-11 text-xs shadow-md transition-all hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)]">방 생성하기</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 🌟 다크 로그인 모달 */}
            <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
                <DialogContent className="sm:max-w-sm bg-zinc-900 border border-zinc-800 p-10 text-center flex flex-col items-center shadow-2xl rounded-[2rem] text-zinc-100 selection:bg-[#00E676]/50">
                    <div className="w-16 h-16 bg-zinc-950 rounded-full flex items-center justify-center mb-6 text-3xl border border-zinc-800 shadow-sm animate-pulse">🎬</div>
                    <DialogTitle className="text-2xl font-black text-white mb-2.5 tracking-tight uppercase">Login</DialogTitle>
                    <p className="text-zinc-400 mb-8 font-medium text-xs leading-relaxed max-w-xs">라운지 개설 권한을 얻으려면<br/>구글 로그인이 필요합니다.</p>
                    <Button variant="outline" className="w-full h-12 flex justify-center items-center gap-2.5 font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl border-zinc-700 shadow-sm transition-all mb-3 text-xs" onClick={() => signIn("google")}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google로 계속하기
                    </Button>
                    <Button variant="ghost" className="text-zinc-500 hover:text-white hover:bg-zinc-800 text-xs font-semibold rounded-xl" onClick={() => setIsLoginModalOpen(false)}>닫기</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}