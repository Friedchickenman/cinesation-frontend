"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Client } from "@stomp/stompjs";

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

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const [showNewMessageBtn, setShowNewMessageBtn] = useState(false);

    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const hasEntered = useRef(false);
    const isFirstLoad = useRef(true);

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

    useEffect(() => {
        const fetchChatHistory = async () => {
            if (!roomId) return;
            try {
                const res = await fetch(`http://localhost:8080/api/rooms/${roomId}/chats`);
                if (res.ok) {
                    const history = await res.json();
                    setMessages(history);
                }
            } catch (err) {
                console.error("채팅 내역을 불러오는데 실패했습니다.", err);
            }
        };
        fetchChatHistory();
    }, [roomId]);

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

                if (!hasEntered.current && session?.user?.name) {
                    const now = new Date();
                    const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

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
            if (stompClient.connected && session?.user?.name) {
                const now = new Date();
                const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

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
    }, [roomId, session]);

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

        const isBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsAutoScroll(isBottom);

        if (isBottom) {
            setShowNewMessageBtn(false);
        }
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

        if (client?.connected && session?.user?.name && e.target.value.trim() !== "") {
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
        if (e.nativeEvent.isComposing) return; // 한글 조합 중일 때 엔터 씹힘 방지

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim() || !client || !client.connected || !session) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

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

        if (textareaRef.current) {
            textareaRef.current.style.height = "52px";
        }
    };

    const handleCopyLink = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleExportChat = () => {
        if (messages.length === 0) return alert("저장할 대화 내역이 없습니다.");

        const chatText = messages.map(msg => {
            if (msg.type === "ENTER" || msg.type === "LEAVE") {
                return `--- ${msg.content} ---`;
            }
            return `[${msg.time || '시간없음'}] ${msg.sender}: ${msg.content}`;
        }).join('\n');

        const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CineSation_방${roomId}_과몰입기록.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const scrollToBottom = () => {
        setIsAutoScroll(true);
        setShowNewMessageBtn(false);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="max-w-5xl mx-auto py-8 animate-in fade-in duration-500 relative">
            <div className="flex justify-between items-center mb-6 px-2">
                <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors">
                    ← 메인으로 돌아가기
                </button>
                <div className="flex gap-2">
                    <button onClick={handleExportChat} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
                        <span>💾</span> 기록 저장
                    </button>
                    <button onClick={handleCopyLink} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isCopied ? "bg-green-100 text-green-700 shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"}`}>
                        {isCopied ? <><span>✅</span> 복사 완료!</> : <><span>🔗</span> 공유하기</>}
                    </button>
                </div>
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
                            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${room.poster_path})` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                        </>
                    )}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-blue-600 rounded-md text-xs font-black tracking-widest shadow-lg">OPEN</span>
                            <span className="text-slate-300 text-sm font-medium">No. {room.id}</span>
                            <span className="text-blue-300/80 text-sm font-medium border-l border-white/20 pl-3">방장: {room.creatorName}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight drop-shadow-lg">{room.title}</h1>
                        <p className="text-slate-200 text-lg md:text-xl font-medium drop-shadow-md">
                            <span className="text-blue-400 font-bold border-b border-blue-400/30 pb-0.5">{room.real_movie_title || room.movieId}</span> 에 대한 과몰입 토론방
                        </p>
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
                        {messages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                아직 대화가 없습니다. 첫 번째 메시지를 보내보세요!
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                if (msg.type === "ENTER" || msg.type === "LEAVE") {
                                    return (
                                        <div key={idx} className="flex justify-center my-3">
                                            <span className="bg-slate-800/80 backdrop-blur-sm text-white text-xs font-semibold px-5 py-2 rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
                                                {msg.content}
                                            </span>
                                        </div>
                                    );
                                }

                                const isMe = session?.user?.name === msg.sender;

                                return (
                                    <div key={idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 shadow-sm ${isMe ? 'bg-gray-200 border-gray-300' : 'bg-blue-100 border-blue-200'}`}>
                                            {isMe ? "😎" : "🍿"}
                                        </div>
                                        <div className={`flex flex-col ${isMe ? 'items-end' : ''}`}>
                                            <span className={`text-xs font-semibold text-gray-500 mb-1.5 block ${isMe ? 'mr-1' : 'ml-1'}`}>
                                                {msg.sender}
                                            </span>
                                            {/* whitespace-pre-wrap 추가로 줄바꿈 적용 */}
                                            <div className={`py-2.5 px-4 rounded-2xl shadow-sm inline-block max-w-lg leading-relaxed whitespace-pre-wrap ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                                                {msg.content}
                                            </div>
                                            {msg.time && (
                                                <span className={`text-[10px] text-gray-400 mt-1 block ${isMe ? 'mr-1 text-right' : 'ml-1'}`}>
                                                    {msg.time}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* 타이핑 인디케이터 */}
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
                            <button
                                onClick={scrollToBottom}
                                className="bg-slate-800/90 backdrop-blur-sm text-white px-5 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors"
                            >
                                <span>👇</span> 새 메시지가 있습니다
                            </button>
                        </div>
                    )}

                    <div className="p-4 bg-white border-t border-gray-200 shrink-0 z-20">
                        <div className="flex items-end gap-3">
                            <textarea
                                ref={textareaRef}
                                value={inputMessage}
                                onChange={handleTyping}
                                onKeyDown={handleKeyDown}
                                placeholder={session ? "과몰입 멘트를 입력해 주세요... (Shift+Enter로 줄바꿈)" : "로그인 후 참여 가능합니다."}
                                disabled={!session || !client?.connected}
                                rows={1}
                                style={{ height: "52px", minHeight: "52px" }}
                                className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none overflow-y-auto leading-relaxed"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!session || !client?.connected || !inputMessage.trim()}
                                className="px-7 py-3.5 h-[52px] bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 transition-colors shrink-0"
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