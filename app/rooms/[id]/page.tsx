"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Client } from "@stomp/stompjs";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.id;
    const router = useRouter();
    const { data: session } = useSession();

    const [room, setRoom] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    const [client, setClient] = useState<Client | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState("");

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const [showNewMessageBtn, setShowNewMessageBtn] = useState(false);

    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const hasEntered = useRef(false);
    const isFirstLoad = useRef(true);

    // 🌟 방 정보 & TMDB 상세 정보 불러오기 (업그레이드 됨!)
    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/rooms/${roomId}`);
                if (!res.ok) throw new Error("방 정보를 찾을 수 없거나 서버 에러입니다.");
                const roomData = await res.json();

                const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                if (roomData.movieId && !roomData.movieId.startsWith("m_")) {
                    // 🌟 append_to_response=credits 를 추가해서 배우/감독 정보까지 한 번에 가져옵니다!
                    const tmdbRes = await fetch(
                        `https://api.themoviedb.org/3/movie/${roomData.movieId}?language=ko-KR&append_to_response=credits&api_key=${apiKey}`
                    );
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        roomData.poster_path = tmdbData.poster_path;
                        roomData.backdrop_path = tmdbData.backdrop_path; // 와이드 배경화면
                        roomData.real_movie_title = tmdbData.title;
                        roomData.release_year = tmdbData.release_date?.substring(0, 4);
                        roomData.runtime = tmdbData.runtime;
                        roomData.genres = tmdbData.genres?.map((g: any) => g.name);

                        // 감독 정보 추출
                        const director = tmdbData.credits?.crew?.find((c: any) => c.job === 'Director');
                        roomData.director = director ? director.name : '정보 없음';

                        // 주요 출연진 3명 추출
                        const cast = tmdbData.credits?.cast?.slice(0, 3).map((c: any) => c.name);
                        roomData.cast = cast?.length > 0 ? cast.join(', ') : '정보 없음';
                    }
                }
                setRoom(roomData);
                setIsLoading(false);
            } catch (err: any) {
                setError(err.message);
                setIsLoading(false);
                toast.error("방 정보를 불러오는데 실패했습니다.");
            }
        };
        fetchRoomData();
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;
        const fetchInitialChat = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/rooms/${roomId}/chats?page=0&size=30`);
                if (res.ok) {
                    const history = await res.json();
                    if (history.length < 30) setHasMore(false);
                    setMessages(history);
                    setPage(1);
                }
            } catch (err) {
                console.error("채팅 내역을 불러오는데 실패했습니다.", err);
            }
        };
        fetchInitialChat();
    }, [roomId]);

    const loadMoreMessages = async () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const res = await fetch(`http://localhost:8080/api/rooms/${roomId}/chats?page=${page}&size=30`);
            if (res.ok) {
                const history = await res.json();
                if (history.length < 30) setHasMore(false);

                const container = chatContainerRef.current;
                const previousScrollHeight = container?.scrollHeight || 0;

                setMessages(prev => [...history, ...prev]);

                setTimeout(() => {
                    if (container) {
                        container.scrollTop = container.scrollHeight - previousScrollHeight;
                    }
                }, 0);
                setPage(prev => prev + 1);
            }
        } catch (err) {
            console.error("추가 채팅을 불러오는데 실패했습니다.", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!roomId) return;

        const stompClient = new Client({
            brokerURL: "ws://localhost:8080/ws-chat",
            reconnectDelay: 5000,
            onConnect: () => {
                stompClient.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                    const receivedMsg = JSON.parse(message.body);

                    if (receivedMsg.type === "TYPING") {
                        if (receivedMsg.sender !== session?.user?.name) {
                            setTypingUsers(prev => {
                                const newSet = new Set(prev);
                                newSet.add(receivedMsg.sender);
                                return newSet;
                            });

                            if (typingTimeouts.current[receivedMsg.sender]) {
                                clearTimeout(typingTimeouts.current[receivedMsg.sender]);
                            }
                            typingTimeouts.current[receivedMsg.sender] = setTimeout(() => {
                                setTypingUsers(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(receivedMsg.sender);
                                    return newSet;
                                });
                            }, 2000);
                        }
                        return;
                    }

                    setMessages((prev) => [...prev, receivedMsg]);

                    if (receivedMsg.type === "TALK") {
                        setTypingUsers(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(receivedMsg.sender);
                            return newSet;
                        });
                    }
                });

                if (!hasEntered.current && session?.user?.name && room?.status !== 'CLOSED') {
                    const timeString = new Date().toISOString();
                    stompClient.publish({
                        destination: "/pub/chat/message",
                        body: JSON.stringify({
                            roomId: Number(roomId),
                            sender: session.user.name,
                            content: "",
                            time: timeString,
                            type: "ENTER"
                        }),
                    });
                    hasEntered.current = true;
                }
            },
        });

        stompClient.activate();
        setClient(stompClient);

        return () => {
            if (stompClient.connected && session?.user?.name && room?.status !== 'CLOSED') {
                const timeString = new Date().toISOString();
                stompClient.publish({
                    destination: "/pub/chat/message",
                    body: JSON.stringify({
                        roomId: Number(roomId),
                        sender: session.user.name,
                        content: "",
                        time: timeString,
                        type: "LEAVE"
                    }),
                });
            }
            stompClient.deactivate();
        };
    }, [roomId, session, room?.status]);

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        if (scrollTop === 0) loadMoreMessages();
        const isBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsAutoScroll(isBottom);
        if (isBottom) setShowNewMessageBtn(false);
    };

    useEffect(() => {
        if (messages.length > 0) {
            if (isFirstLoad.current) {
                messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                isFirstLoad.current = false;
            } else if (isAutoScroll) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            } else {
                setShowNewMessageBtn(true);
            }
        }
    }, [messages, isAutoScroll]);

    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputMessage(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }

        if (client?.connected && session?.user?.name && e.target.value.trim() !== "" && room?.status !== 'CLOSED') {
            client.publish({
                destination: "/pub/chat/message",
                body: JSON.stringify({
                    roomId: Number(roomId),
                    sender: session.user.name,
                    content: "",
                    time: "",
                    type: "TYPING"
                }),
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim() || !client || !client.connected || !session || room?.status === 'CLOSED') return;
        const timeString = new Date().toISOString();

        const messageObj = {
            roomId: Number(roomId),
            sender: session.user?.name || "익명 유저",
            content: inputMessage.trim(),
            time: timeString,
            type: "TALK"
        };

        client.publish({
            destination: "/pub/chat/message",
            body: JSON.stringify(messageObj),
        });

        setInputMessage("");
        setIsAutoScroll(true);
        setShowNewMessageBtn(false);

        if (textareaRef.current) textareaRef.current.style.height = "52px";
    };

    const handleCopyLink = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(() => {
            setIsCopied(true);
            toast.success("🔗 링크가 클립보드에 복사되었습니다!");
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleExportChat = () => {
        if (messages.length === 0) {
            toast.warning("저장할 대화 내역이 없습니다.");
            return;
        }

        const chatText = messages.map(msg => {
            if (msg.type === "ENTER" || msg.type === "LEAVE") return `--- ${msg.content} ---`;
            let displayTime = msg.time;
            try {
                if (msg.time && msg.time.includes('T')) {
                    displayTime = new Date(msg.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                }
            } catch (e) {}
            return `[${displayTime || '시간없음'}] ${msg.sender}: ${msg.content}`;
        }).join('\n');

        const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CineSation_방${roomId}_과몰입기록.txt`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success("💾 대화 기록이 저장되었습니다!");
    };

    const scrollToBottom = () => {
        setIsAutoScroll(true);
        setShowNewMessageBtn(false);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500 relative px-4">
            <div className="flex justify-between items-center mb-6 px-2">
                <Button variant="ghost" onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    ← 메인으로 돌아가기
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportChat} className="flex items-center gap-2 rounded-full font-bold text-gray-600 shadow-sm">
                        <span>💾</span> 기록 저장
                    </Button>
                    <Button
                        variant={isCopied ? "default" : "outline"}
                        onClick={handleCopyLink}
                        className={`flex items-center gap-2 rounded-full font-bold shadow-sm transition-all ${isCopied ? "bg-green-600 hover:bg-green-700 text-white" : "text-gray-600"}`}
                    >
                        {isCopied ? <><span>✅</span> 복사 완료!</> : <><span>🔗</span> 공유하기</>}
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl mb-8 h-[400px] flex items-center p-8 md:p-12">
                    <Skeleton className="absolute inset-0 w-full h-full bg-slate-800" />
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-red-600 shadow-sm mb-8">
                    <h2 className="text-xl font-bold mb-2">🚨 앗, 문제가 발생했어요!</h2>
                    <p>{error}</p>
                </div>
            ) : (
                <div className="relative bg-slate-900 rounded-3xl text-white shadow-2xl mb-8 overflow-hidden min-h-[380px] p-8 md:p-12 flex items-center">
                    {/* 🌟 와이드 배경(Backdrop) 적용! */}
                    {room?.backdrop_path ? (
                        <>
                            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-overlay" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${room.backdrop_path})` }} />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800" />
                    )}

                    {/* 🌟 영화 정보 & 호스트 주제 섹션 */}
                    <div className="relative z-10 w-full flex flex-col md:flex-row gap-8 items-center md:items-end">
                        {room?.poster_path && (
                            <img
                                src={`https://image.tmdb.org/t/p/w500${room.poster_path}`}
                                alt={room.title}
                                className="w-36 md:w-52 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 shrink-0 transform transition-transform hover:scale-105"
                            />
                        )}
                        <div className="flex-1 w-full text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                                <span className={`px-3 py-1 rounded-md text-xs font-black tracking-widest shadow-lg ${room?.status === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {room?.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                                </span>
                                {room?.genres?.map((g: string) => (
                                    <span key={g} className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-md text-xs font-medium text-slate-200 border border-white/10">{g}</span>
                                ))}
                                {room?.runtime && (
                                    <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-md text-xs font-medium text-slate-200 border border-white/10">{room.runtime}분</span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 leading-tight drop-shadow-lg">
                                {room?.real_movie_title || room?.movieId}
                                {room?.release_year && <span className="text-xl md:text-2xl font-normal text-slate-400 ml-3">({room?.release_year})</span>}
                            </h1>

                            <p className="text-slate-300 text-sm md:text-base drop-shadow-md mb-6 flex flex-col md:flex-row gap-2 md:gap-6 justify-center md:justify-start">
                                <span><span className="text-slate-500 mr-2">감독</span> <span className="font-semibold text-white">{room?.director}</span></span>
                                <span className="hidden md:inline text-slate-600">|</span>
                                <span><span className="text-slate-500 mr-2">출연</span> <span className="font-semibold text-white">{room?.cast}</span></span>
                            </p>

                            {/* 🌟 왓챠/레터박스 감성의 호스트 핀셋 메모! */}
                            <div className="inline-flex flex-col items-start p-5 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl w-full max-w-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-blue-400 text-sm">👑</span>
                                    <span className="text-blue-300 text-xs font-bold tracking-wider">호스트 [{room?.creatorName}]의 과몰입 주제</span>
                                </div>
                                <p className="text-white text-lg md:text-xl font-medium leading-relaxed italic">
                                    "{room?.title}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !error && (
                <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden relative">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-20">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><span>💬</span> 실시간 과몰입 채팅</h3>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${client?.connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${client?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {client?.connected ? "연결됨" : "연결 중..."}
                        </span>
                    </div>

                    <div
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 p-6 overflow-y-auto bg-slate-50/50 flex flex-col gap-5 relative scroll-smooth"
                    >
                        {isLoadingMore && (
                            <div className="flex justify-center py-2">
                                <span className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></span>
                            </div>
                        )}

                        {messages.length === 0 && !isLoadingMore ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                아직 대화가 없습니다. 첫 번째 메시지를 보내보세요!
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                let isNewDay = false;
                                let displayTime = msg.time;
                                let displayDate = "";

                                const currentDate = new Date(msg.time);
                                const isValidDate = !isNaN(currentDate.getTime()) && msg.time?.includes('T');

                                if (isValidDate) {
                                    displayTime = currentDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                                    displayDate = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

                                    if (idx === 0) {
                                        isNewDay = true;
                                    } else {
                                        const prevDate = new Date(messages[idx - 1].time);
                                        const isPrevValid = !isNaN(prevDate.getTime()) && messages[idx - 1].time?.includes('T');

                                        if (isPrevValid && currentDate.toDateString() !== prevDate.toDateString()) {
                                            isNewDay = true;
                                        } else if (!isPrevValid) {
                                            isNewDay = true;
                                        }
                                    }
                                }

                                const isMe = session?.user?.name === msg.sender;

                                return (
                                    <div key={idx} className="flex flex-col">
                                        {isNewDay && (
                                            <div className="flex justify-center my-4 mb-6">
                                                <span className="bg-gray-200/60 text-gray-500 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
                                                    🗓️ {displayDate}
                                                </span>
                                            </div>
                                        )}

                                        {msg.type === "ENTER" || msg.type === "LEAVE" ? (
                                            <div className="flex justify-center my-3">
                                                <span className="bg-slate-800/80 backdrop-blur-sm text-white text-xs font-semibold px-5 py-2 rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
                                                    {msg.content}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 shadow-sm ${isMe ? 'bg-gray-200 border-gray-300' : 'bg-blue-100 border-blue-200'}`}>
                                                    {isMe ? "😎" : "🍿"}
                                                </div>
                                                <div className={`flex flex-col ${isMe ? 'items-end' : ''}`}>
                                                    <span className={`text-xs font-semibold text-gray-500 mb-1.5 block ${isMe ? 'mr-1' : 'ml-1'}`}>
                                                        {msg.sender}
                                                    </span>
                                                    <div className={`py-2.5 px-4 rounded-2xl shadow-sm inline-block max-w-lg leading-relaxed whitespace-pre-wrap ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                                                        {msg.content}
                                                    </div>
                                                    {displayTime && (
                                                        <span className={`text-[10px] text-gray-400 mt-1 block ${isMe ? 'mr-1 text-right' : 'ml-1'}`}>
                                                            {displayTime}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        {typingUsers.size > 0 && (
                            <div className="flex gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-lg shrink-0 shadow-sm">🍿</div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-500 mb-1 ml-1">
                                        {Array.from(typingUsers).join(", ")}님이 입력 중...
                                    </span>
                                    <div className="py-3 px-5 rounded-2xl bg-white border border-gray-200 rounded-tl-none shadow-sm flex items-center gap-1.5 w-fit">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {showNewMessageBtn && (
                        <div className="absolute bottom-24 left-0 w-full flex justify-center z-30 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            <Button
                                onClick={scrollToBottom}
                                className="bg-slate-800/90 hover:bg-slate-700 backdrop-blur-sm text-white px-5 rounded-full shadow-lg font-bold flex items-center gap-2"
                            >
                                <span>👇</span> 새 메시지가 있습니다
                            </Button>
                        </div>
                    )}

                    <div className="p-4 bg-white border-t border-gray-200 shrink-0 z-20">
                        <div className="flex items-end gap-3">
                            <textarea
                                ref={textareaRef}
                                value={inputMessage}
                                onChange={handleTyping}
                                onKeyDown={handleKeyDown}
                                placeholder={room?.status === 'CLOSED' ? "🔒 7일이 지나 종료된 토론방입니다. (읽기 전용)" : session ? "과몰입 멘트를 입력해 주세요... (Shift+Enter로 줄바꿈)" : "로그인 후 참여 가능합니다."}
                                disabled={!session || !client?.connected || room?.status === 'CLOSED'}
                                rows={1}
                                style={{ height: "52px", minHeight: "52px" }}
                                className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none overflow-y-auto leading-relaxed"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!session || !client?.connected || !inputMessage.trim() || room?.status === 'CLOSED'}
                                className="h-[52px] px-7 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 shrink-0"
                            >
                                전송
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}