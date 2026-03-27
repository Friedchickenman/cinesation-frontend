"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

interface ChatSectionProps {
    room: any;
    session: any;
    client: any;
    messages: any[];
    inputMessage: string;
    isLoadingMore: boolean;
    showNewMessageBtn: boolean;
    typingUsers: Set<string>;
    chatContainerRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    onScroll: () => void;
    onTyping: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onSendMessage: () => void;
    onScrollToBottom: () => void;

    replyingTo: any | null;
    onReply: (msg: any) => void;
    onCancelReply: () => void;

    // 🌟 1. onLike Props 추가
    onLike: (msgId: number) => void;
}

export default function ChatSection({
                                        room, session, client, messages, inputMessage, isLoadingMore, showNewMessageBtn,
                                        typingUsers, chatContainerRef, messagesEndRef, textareaRef,
                                        onScroll, onTyping, onKeyDown, onSendMessage, onScrollToBottom,
                                        replyingTo, onReply, onCancelReply, onLike // 🌟 가져오기
                                    }: ChatSectionProps) {

    const t = useTranslations("RoomDetail");
    const locale = useLocale();
    const timeFormatLang = locale === 'en' ? 'en-US' : 'ko-KR';

    const [localPinnedMessage, setLocalPinnedMessage] = useState<string | null>(null);
    const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (room?.pinnedMessage) {
            setLocalPinnedMessage(room.pinnedMessage);
        }
    }, [room?.pinnedMessage]);

    const handlePinMessage = async (content: string) => {
        const confirmMsg = locale === 'en'
            ? (content ? "Pin this message to the top?" : "Unpin the current message?")
            : (content ? "이 메시지를 공지로 등록하시겠습니까?" : "공지를 내리시겠습니까?");

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch(`http://localhost:8080/api/rooms/${room.id}/pin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, username: session?.user?.name })
            });

            if (res.ok) {
                setLocalPinnedMessage(content || null);
            } else {
                alert(locale === 'en' ? "Failed to pin message." : "공지 등록에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const visibleTypingUsers = Array.from(typingUsers).filter(user => !mutedUsers.has(user));

    return (
        <div className="flex flex-col h-[650px] bg-[#09090B] border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden relative">
            <div className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0 z-20">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm tracking-wide">
                    <span className="opacity-80">💬</span> {t('liveLounge')}
                </h3>
                <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full flex items-center gap-2 border ${client?.connected ? 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30' : 'bg-red-900/20 text-red-500 border-red-900/30'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${client?.connected ? 'bg-[#00E676] animate-pulse' : 'bg-red-500'}`}></span>
                    {client?.connected ? t('connected') : t('reconnecting')}
                </span>
            </div>

            {localPinnedMessage && (
                <div className="bg-zinc-800/95 backdrop-blur-md border-b border-zinc-700 px-6 py-3.5 flex items-start gap-3 shrink-0 z-10 shadow-lg animate-in slide-in-from-top-2">
                    <span className="text-lg animate-bounce">📌</span>
                    <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-[#00E676] uppercase tracking-widest">
                                {locale === 'en' ? "Pinned Message" : "라운지 공지사항"}
                            </span>
                            <button onClick={() => handlePinMessage("")} className="text-[10px] font-bold text-zinc-500 hover:text-red-400 transition-colors underline underline-offset-2">
                                {locale === 'en' ? "Unpin" : "내리기"}
                            </button>
                        </div>
                        <span className="text-sm text-zinc-100 font-medium break-words leading-relaxed line-clamp-2">
                            {localPinnedMessage}
                        </span>
                    </div>
                </div>
            )}

            <div ref={chatContainerRef} onScroll={onScroll} className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 relative scroll-smooth bg-transparent">
                {isLoadingMore && (
                    <div className="flex justify-center py-2">
                        <span className="w-6 h-6 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></span>
                    </div>
                )}

                {messages.length === 0 && !isLoadingMore ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-sm gap-4">
                        <span className="text-4xl opacity-30">🍿</span>
                        {t('noMessages')}
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        let isNewDay = false;
                        let displayTime = msg.time;
                        let displayDate = "";

                        const currentDate = new Date(msg.time);
                        const isValidDate = !isNaN(currentDate.getTime()) && msg.time?.includes('T');

                        if (isValidDate) {
                            displayTime = currentDate.toLocaleTimeString(timeFormatLang, { hour: '2-digit', minute: '2-digit' });
                            displayDate = currentDate.toLocaleDateString(timeFormatLang, { year: 'numeric', month: 'short', day: 'numeric' });

                            if (idx === 0) isNewDay = true;
                            else {
                                const prevDate = new Date(messages[idx - 1].time);
                                const isPrevValid = !isNaN(prevDate.getTime()) && messages[idx - 1].time?.includes('T');
                                if (isPrevValid && currentDate.toDateString() !== prevDate.toDateString()) isNewDay = true;
                                else if (!isPrevValid) isNewDay = true;
                            }
                        }

                        const isMe = session?.user?.name === msg.sender;

                        if (mutedUsers.has(msg.sender)) {
                            return (
                                <div key={idx} className="flex justify-center my-1 animate-in fade-in duration-300">
                                    <button
                                        onClick={() => {
                                            if (confirm(locale === 'en' ? `Unblock ${msg.sender}?` : `${msg.sender} 님을 차단 해제하시겠습니까?`)) {
                                                setMutedUsers(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(msg.sender);
                                                    return newSet;
                                                });
                                            }
                                        }}
                                        className="bg-zinc-900 border border-zinc-800/50 text-zinc-600 text-[10px] font-medium px-4 py-1.5 rounded-full shadow-sm hover:text-zinc-400 hover:border-zinc-700 transition-all"
                                    >
                                        🚫 {locale === 'en' ? `Hidden message from ${msg.sender} (Click to unblock)` : `${msg.sender}님의 메시지가 가려졌습니다. (클릭하여 해제)`}
                                    </button>
                                </div>
                            );
                        }

                        const parentMsg = msg.parentMessageId
                            ? messages.find(m => m.id === msg.parentMessageId)
                            : null;

                        return (
                            <div key={idx} className="flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out">
                                {isNewDay && (
                                    <div className="flex justify-center my-4 mb-6">
                                        <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                                            {displayDate}
                                        </span>
                                    </div>
                                )}

                                {msg.type === "ENTER" || msg.type === "LEAVE" ? (
                                    <div className="flex justify-center my-2">
                                        <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-medium px-5 py-1.5 rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
                                            {msg.type === "ENTER" ? `${msg.sender}${t('msgEnter')}` : `${msg.sender}${t('msgLeave')}`}
                                        </span>
                                    </div>
                                ) : (
                                    <div className={`group flex gap-3 w-full ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 border shadow-sm ${isMe ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900 border-zinc-800'}`}>
                                            {isMe ? "😎" : "🍿"}
                                        </div>
                                        <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>

                                            <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'flex-row-reverse mr-1' : 'ml-1'}`}>
                                                <span className="text-[11px] font-bold text-zinc-500">
                                                    {msg.sender}
                                                </span>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">

                                                    {/* 🌟 2. 좋아요(👍) 버튼 추가 */}
                                                    {msg.id && (
                                                        <button
                                                            onClick={() => onLike(msg.id)}
                                                            className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 shadow-sm"
                                                            title={locale === 'en' ? "Like" : "공감하기"}
                                                        >
                                                            👍
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => onReply(msg)}
                                                        className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 shadow-sm"
                                                        title={locale === 'en' ? "Reply" : "답장하기"}
                                                    >
                                                        ↩️
                                                    </button>
                                                    <button
                                                        onClick={() => handlePinMessage(msg.content)}
                                                        className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 shadow-sm"
                                                        title={locale === 'en' ? "Pin message" : "이 메시지 공지로 등록"}
                                                    >
                                                        📌
                                                    </button>
                                                    {!isMe && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(locale === 'en' ? `Hide messages from ${msg.sender}?` : `${msg.sender} 님의 메시지를 숨기시겠습니까?`)) {
                                                                    setMutedUsers(prev => {
                                                                        const newSet = new Set(prev);
                                                                        newSet.add(msg.sender);
                                                                        return newSet;
                                                                    });
                                                                }
                                                            }}
                                                            className="text-[10px] bg-zinc-800 hover:bg-red-900/80 hover:text-red-400 px-1.5 py-0.5 rounded text-zinc-300 shadow-sm transition-colors"
                                                            title={locale === 'en' ? "Hide user" : "이 유저 가리기"}
                                                        >
                                                            🚫
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 🌟 3. 말풍선 및 하단 좋아요 배지 영역 */}
                                            <div className="relative">
                                                <div className={`py-2.5 px-4 shadow-sm inline-block leading-relaxed whitespace-pre-wrap text-sm break-words flex flex-col ${isMe ? 'bg-white text-black rounded-[1.25rem] rounded-tr-sm font-medium' : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-[1.25rem] rounded-tl-sm'}`}>
                                                    {msg.parentMessageId && (
                                                        <div className={`mb-2 px-3 py-1.5 rounded-lg text-xs border-l-2 ${isMe ? 'bg-zinc-200/60 border-zinc-400 text-zinc-700' : 'bg-zinc-800/80 border-zinc-500 text-zinc-400'} line-clamp-2`}>
                                                            <span className="font-bold mr-1.5">
                                                                {parentMsg ? parentMsg.sender : locale === 'en' ? "Someone" : "누군가"}{locale === 'en' ? ":" : "에게 답장:"}
                                                            </span>
                                                            <span className="opacity-80">
                                                                {parentMsg ? parentMsg.content : locale === 'en' ? "Message not found." : "이전 메시지를 찾을 수 없습니다."}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span>{msg.content}</span>
                                                </div>

                                                {/* 🌟 4. 좋아요가 1개 이상일 때 나타나는 예쁜 배지 UI */}
                                                {(msg.likeCount || 0) > 0 && (
                                                    <div className={`absolute -bottom-3 ${isMe ? 'left-2' : 'right-2'} bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 animate-in zoom-in duration-200 z-10`}>
                                                        <span className="text-[10px]">❤️</span>
                                                        <span className="text-[10px] font-bold text-white">{msg.likeCount}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {displayTime && (
                                                <span className={`text-[9px] text-zinc-600 mt-2 block font-medium ${isMe ? 'mr-1 text-right' : 'ml-1'}`}>
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

                {visibleTypingUsers.length > 0 && (
                    <div className="flex gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-base shrink-0 shadow-sm">✍️</div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-zinc-500 mb-1 ml-1">
                                {visibleTypingUsers.join(", ")} {t('isTyping')}
                            </span>
                            <div className="py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-[1.25rem] rounded-tl-sm shadow-sm flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {showNewMessageBtn && (
                <div className="absolute bottom-28 left-0 w-full flex justify-center z-30 animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <Button onClick={onScrollToBottom} className="bg-white/90 hover:bg-white backdrop-blur-md text-black px-6 rounded-full shadow-lg font-bold flex items-center gap-2 text-xs">
                        <span>👇</span> {t('newMessage')}
                    </Button>
                </div>
            )}

            <div className="relative p-4 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 shrink-0 z-20 flex flex-col">

                {replyingTo && (
                    <div className="flex items-center justify-between bg-zinc-800/90 px-4 py-2.5 rounded-t-2xl border-t border-x border-zinc-700 text-xs w-full max-w-full truncate mb-2 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 truncate text-zinc-300">
                            <span className="text-[10px]">↩️</span>
                            <span className="font-bold text-[#00E676]">{replyingTo.sender}</span>
                            <span className="text-zinc-400">{locale === 'en' ? "Replying to" : "님에게 답장 중"}</span>
                            <span className="truncate opacity-70 ml-1">"{replyingTo.content}"</span>
                        </div>
                        <button onClick={onCancelReply} className="text-zinc-400 hover:text-white ml-2 shrink-0 bg-zinc-700/50 hover:bg-zinc-600 w-5 h-5 rounded-full flex items-center justify-center transition-colors">
                            ✕
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-3">
                    <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={onTyping}
                        onKeyDown={onKeyDown}
                        placeholder={room?.status === 'CLOSED' ? t('placeholderClosed') : session ? t('placeholderInput') : t('placeholderLogin')}
                        disabled={!session || !client?.connected || room?.status === 'CLOSED'}
                        rows={1}
                        style={{ height: "52px", minHeight: "52px" }}
                        className={`flex-1 px-5 py-3.5 bg-zinc-950 border border-zinc-800 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 disabled:opacity-50 resize-none overflow-y-auto leading-relaxed text-sm text-white placeholder:text-zinc-600 transition-colors ${replyingTo ? 'rounded-b-2xl rounded-t-none border-t-0' : 'rounded-2xl'}`}
                    />
                    <Button
                        onClick={onSendMessage}
                        disabled={!session || !client?.connected || !inputMessage.trim() || room?.status === 'CLOSED'}
                        className="h-[52px] px-8 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-2xl disabled:opacity-50 shrink-0 transition-transform active:scale-95"
                    >
                        {t('sendBtn')}
                    </Button>
                </div>
            </div>
        </div>
    );
}