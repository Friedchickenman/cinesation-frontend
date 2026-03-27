"use client";

import { useTranslations, useLocale } from "next-intl";

interface ChatMessageListProps {
    messages: any[];
    session: any;
    mutedUsers: Set<string>;
    setMutedUsers: React.Dispatch<React.SetStateAction<Set<string>>>;
    onLike: (msgId: number) => void;
    onReply: (msg: any) => void;
    onPinMessage: (content: string) => void;
    isLoadingMore: boolean;
    typingUsers: Set<string>;
    chatContainerRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onScroll: () => void;
}

export default function ChatMessageList({
                                            messages, session, mutedUsers, setMutedUsers, onLike, onReply, onPinMessage,
                                            isLoadingMore, typingUsers, chatContainerRef, messagesEndRef, onScroll
                                        }: ChatMessageListProps) {
    const t = useTranslations("RoomDetail");
    const locale = useLocale();
    const timeFormatLang = locale === 'en' ? 'en-US' : 'ko-KR';

    const visibleTypingUsers = Array.from(typingUsers).filter(user => !mutedUsers.has(user));

    return (
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
                    const hasLiked = msg.likedUsers?.includes(`[${session?.user?.name}]`);

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

                    const parentMsg = msg.parentMessageId ? messages.find(m => m.id === msg.parentMessageId) : null;

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
                                            <span className="text-[11px] font-bold text-zinc-500">{msg.sender}</span>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                {msg.id && (
                                                    <button onClick={() => onLike(msg.id)} className={`text-[10px] px-1.5 py-0.5 rounded shadow-sm transition-colors ${hasLiked ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`} title={locale === 'en' ? (hasLiked ? "Unlike" : "Like") : (hasLiked ? "공감 취소" : "공감하기")}>
                                                        {hasLiked ? '❤️' : '👍'}
                                                    </button>
                                                )}
                                                <button onClick={() => onReply(msg)} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 shadow-sm" title={locale === 'en' ? "Reply" : "답장하기"}>↩️</button>
                                                <button onClick={() => onPinMessage(msg.content)} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 shadow-sm" title={locale === 'en' ? "Pin message" : "이 메시지 공지로 등록"}>📌</button>
                                                {!isMe && (
                                                    <button onClick={() => {
                                                        if (confirm(locale === 'en' ? `Hide messages from ${msg.sender}?` : `${msg.sender} 님의 메시지를 숨기시겠습니까?`)) {
                                                            setMutedUsers(prev => { const newSet = new Set(prev); newSet.add(msg.sender); return newSet; });
                                                        }
                                                    }} className="text-[10px] bg-zinc-800 hover:bg-red-900/80 hover:text-red-400 px-1.5 py-0.5 rounded text-zinc-300 shadow-sm transition-colors" title={locale === 'en' ? "Hide user" : "이 유저 가리기"}>🚫</button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className={`py-2.5 px-4 shadow-sm inline-block leading-relaxed whitespace-pre-wrap text-sm break-words flex flex-col ${isMe ? 'bg-white text-black rounded-[1.25rem] rounded-tr-sm font-medium' : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-[1.25rem] rounded-tl-sm'}`}>
                                                {msg.parentMessageId && (
                                                    <div className={`mb-2 px-3 py-1.5 rounded-lg text-xs border-l-2 ${isMe ? 'bg-zinc-200/60 border-zinc-400 text-zinc-700' : 'bg-zinc-800/80 border-zinc-500 text-zinc-400'} line-clamp-2`}>
                                                        <span className="font-bold mr-1.5">{parentMsg ? parentMsg.sender : locale === 'en' ? "Someone" : "누군가"}{locale === 'en' ? ":" : "에게 답장:"}</span>
                                                        <span className="opacity-80">{parentMsg ? parentMsg.content : locale === 'en' ? "Message not found." : "이전 메시지를 찾을 수 없습니다."}</span>
                                                    </div>
                                                )}
                                                <span>{msg.content}</span>
                                            </div>
                                            {(msg.likeCount || 0) > 0 && (
                                                <div className={`absolute -bottom-3 ${isMe ? 'left-2' : 'right-2'} bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 animate-in zoom-in duration-200 z-10`}>
                                                    <span className="text-[10px]">❤️</span>
                                                    <span className="text-[10px] font-bold text-white">{msg.likeCount}</span>
                                                </div>
                                            )}
                                        </div>
                                        {displayTime && <span className={`text-[9px] text-zinc-600 mt-2 block font-medium ${isMe ? 'mr-1 text-right' : 'ml-1'}`}>{displayTime}</span>}
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
                        <span className="text-[10px] font-bold text-zinc-500 mb-1 ml-1">{visibleTypingUsers.join(", ")} {t('isTyping')}</span>
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
    );
}