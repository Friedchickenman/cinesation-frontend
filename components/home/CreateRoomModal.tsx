import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    session: any;
}

export default function CreateRoomModal({ isOpen, onClose, onSuccess, session }: CreateRoomModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<any>(null);
    const [newTitle, setNewTitle] = useState("");
    const [newMovieId, setNewMovieId] = useState("");

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
            const res = await fetch(`https://api.themoviedb.org/3/search/movie?query=${searchQuery}&language=ko-KR&api_key=${apiKey}`);
            const data = await res.json();
            setSearchResults(data.results || []);
        } catch (err) {
            toast.error("영화 검색 중 오류가 발생했습니다.");
        }
    };

    const closeModal = () => {
        onClose();
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
            onSuccess();
            closeModal();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
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
    );
}