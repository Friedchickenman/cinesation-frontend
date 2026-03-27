"use client";

import { use, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Client } from "@stomp/stompjs";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import RoomActionHeader from "@/components/room/RoomActionHeader";
import RoomMovieBanner from "@/components/room/RoomMovieBanner";
import ChatSection from "@/components/room/ChatSection";

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.id;
    const { data: session } = useSession();

    const locale = useLocale();
    const tmdbLang = locale === 'en' ? 'en-US' : 'ko-KR';
    const t = useTranslations("RoomDetail");

    const [room, setRoom] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    const [client, setClient] = useState<Client | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState("");

    const [isConnected, setIsConnected] = useState(false);
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

    const [replyingTo, setReplyingTo] = useState<any | null>(null);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/rooms/${roomId}`);
                if (!res.ok) throw new Error(t('toastRoomInfoError'));
                const roomData = await res.json();

                const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                if (roomData.movieId && !roomData.movieId.startsWith("m_")) {
                    const tmdbRes = await fetch(
                        `https://api.themoviedb.org/3/movie/${roomData.movieId}?language=${tmdbLang}&append_to_response=credits&api_key=${apiKey}`
                    );
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        roomData.poster_path = tmdbData.poster_path;
                        roomData.backdrop_path = tmdbData.backdrop_path;
                        roomData.real_movie_title = tmdbData.title;
                        roomData.release_year = tmdbData.release_date?.substring(0, 4);
                        roomData.runtime = tmdbData.runtime;
                        roomData.genres = tmdbData.genres?.map((g: any) => g.name);

                        const director = tmdbData.credits?.crew?.find((c: any) => c.job === 'Director');
                        roomData.director = director ? director.name : t('noInfo');

                        const cast = tmdbData.credits?.cast?.slice(0, 3).map((c: any) => c.name);
                        roomData.cast = cast?.length > 0 ? cast.join(', ') : t('noInfo');
                    }
                }
                setRoom(roomData);
                setIsLoading(false);
            } catch (err: any) {
                setError(err.message);
                setIsLoading(false);
                toast.error(t('toastRoomLoadFail'));
            }
        };
        fetchRoomData();
    }, [roomId, tmdbLang, t]);

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
        if (!roomId || isLoading || error) return;

        const stompClient = new Client({
            brokerURL: "ws://localhost:8080/ws-chat",
            reconnectDelay: 5000,
            onConnect: () => {
                setIsConnected(true);

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

                    // 🌟 1. "LIKE" 이벤트 수신 처리 (likedUsers 명단도 갱신!)
                    if (receivedMsg.type === "LIKE") {
                        setMessages(prev => prev.map(msg =>
                            msg.id === receivedMsg.id ? {
                                ...msg,
                                likeCount: receivedMsg.likeCount,
                                likedUsers: receivedMsg.likedUsers // 👈 이 부분이 추가되었습니다!
                            } : msg
                        ));
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
                    stompClient.publish({
                        destination: "/pub/chat/message",
                        body: JSON.stringify({
                            roomId: Number(roomId), sender: session.user.name, content: "", time: new Date().toISOString(), type: "ENTER"
                        }),
                    });
                    hasEntered.current = true;
                }
            },
            onWebSocketClose: () => {
                setIsConnected(false);
            }
        });

        stompClient.activate();
        setClient(stompClient);

        return () => {
            if (stompClient.connected && session?.user?.name && room?.status !== 'CLOSED') {
                stompClient.publish({
                    destination: "/pub/chat/message",
                    body: JSON.stringify({
                        roomId: Number(roomId), sender: session.user.name, content: "", time: new Date().toISOString(), type: "LEAVE"
                    }),
                });
            }
            stompClient.deactivate();
            setIsConnected(false);
        };
    }, [roomId, session, isLoading, error]);

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
                body: JSON.stringify({ roomId: Number(roomId), sender: session.user.name, content: "", time: "", type: "TYPING" }),
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

        client.publish({
            destination: "/pub/chat/message",
            body: JSON.stringify({
                roomId: Number(roomId),
                sender: session.user?.name || t('anonymous'),
                content: inputMessage.trim(),
                time: new Date().toISOString(),
                type: "TALK",
                parentMessageId: replyingTo?.id || null
            }),
        });

        setInputMessage("");
        setReplyingTo(null);

        setIsAutoScroll(true);
        setShowNewMessageBtn(false);
        if (textareaRef.current) textareaRef.current.style.height = "52px";
    };

    const handleLikeMessage = (msgId: number) => {
        if (!client || !client.connected || !session || room?.status === 'CLOSED') return;
        client.publish({
            destination: "/pub/chat/message",
            body: JSON.stringify({
                roomId: Number(roomId),
                sender: session.user?.name || t('anonymous'),
                content: "",
                time: new Date().toISOString(),
                type: "LIKE",
                id: msgId
            }),
        });
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setIsCopied(true);
            toast.success(t('toastCopied'));
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleExportChat = () => {
        if (messages.length === 0) { toast.warning(t('toastNoChatToSave')); return; }
        const chatText = messages.map(msg => {
            if (msg.type === "ENTER" || msg.type === "LEAVE") return `--- ${msg.content} ---`;
            let displayTime = msg.time;
            if (msg.time && msg.time.includes('T')) displayTime = new Date(msg.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            return `[${displayTime || '시간없음'}] ${msg.sender}: ${msg.content}`;
        }).join('\n');

        const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CineSation_방${roomId}_과몰입기록.txt`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(t('toastChatSaved'));
    };

    const scrollToBottom = () => {
        setIsAutoScroll(true);
        setShowNewMessageBtn(false);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500 relative px-4">
            <RoomActionHeader
                onExportChat={handleExportChat}
                onCopyLink={handleCopyLink}
                isCopied={isCopied}
            />
            <RoomMovieBanner
                room={room}
                isLoading={isLoading}
                error={error}
            />
            {!isLoading && !error && (
                <ChatSection
                    room={room}
                    session={session}
                    client={client}
                    messages={messages}
                    inputMessage={inputMessage}
                    isLoadingMore={isLoadingMore}
                    showNewMessageBtn={showNewMessageBtn}
                    typingUsers={typingUsers}
                    chatContainerRef={chatContainerRef}
                    messagesEndRef={messagesEndRef}
                    textareaRef={textareaRef}
                    onScroll={handleScroll}
                    onTyping={handleTyping}
                    onKeyDown={handleKeyDown}
                    onSendMessage={handleSendMessage}
                    onScrollToBottom={scrollToBottom}
                    replyingTo={replyingTo}
                    onReply={setReplyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    onLike={handleLikeMessage}
                />
            )}
        </div>
    );
}