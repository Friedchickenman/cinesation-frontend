"use client";

import { useState } from "react"; // 🌟 스포일러 상태 관리를 위해 추가
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

// 🌟 1. 스포일러 텍스트를 가려주는 미니 컴포넌트 추가!
const SpoilerText = ({ text, isMe }: { text: string, isMe: boolean }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    return (
        <span
            onClick={() => setIsRevealed(true)}
            title={isRevealed ? "" : "클릭해서 스포일러 보기"}
            className={`cursor-pointer rounded px-1.5 py-0.5 mx-0.5 transition-all duration-300 inline-block ${
                isRevealed
                    ? (isMe ? "bg-zinc-200 text-black" : "bg-zinc-800 text-zinc-200")
                    : (isMe ? "bg-zinc-400 text-transparent select-none hover:bg-zinc-300" : "bg-zinc-700 text-transparent select-none hover:bg-zinc-600")
            }`}
        >
            {text}
        </span>
    );
};

// 🌟 2. 메시지 안에서 ||스포일러|| 문법을 찾아내는 변환 함수
const renderMessageContent = (content: string, isMe: boolean) => {
    const parts = content.split(/(\|\|.*?\|\|)/g);

    return parts.map((part, i) => {
        if (part.startsWith('||') && part.endsWith('||') && part.length > 4) {
            return <SpoilerText key={i} text={part.slice(2, -2)} isMe={isMe} />;
        }
        return <span key={i}>{part}</span>;
    });
};

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
}

export default function ChatSection({
                                        room, session, client, messages, inputMessage, isLoadingMore, showNewMessageBtn,
                                        typingUsers, chatContainerRef, messagesEndRef, textareaRef,
                                        onScroll, onTyping, onKeyDown, onSendMessage, onScrollToBottom
                                    }: ChatSectionProps) {

    const t = useTranslations("RoomDetail");
    const locale = useLocale();

    const timeFormatLang = locale === 'en' ? 'en-US' : 'ko-KR';

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
                                    <div className={`flex gap-3 w-full ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 border shadow-sm ${isMe ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900 border-zinc-800'}`}>
                                            {isMe ? "😎" : "🍿"}
                                        </div>
                                        <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className={`text-[11px] font-bold text-zinc-500 mb-1.5 block ${isMe ? 'mr-1' : 'ml-1'}`}>
                                                {msg.sender}
                                            </span>
                                            <div className={`py-2.5 px-4 shadow-sm inline-block leading-relaxed whitespace-pre-wrap text-sm break-words ${isMe ? 'bg-white text-black rounded-[1.25rem] rounded-tr-sm font-medium' : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-[1.25rem] rounded-tl-sm'}`}>
                                                {/* 🌟 3. 여기서 변환 함수를 통해 스포일러 처리된 내용을 렌더링합니다! */}
                                                {renderMessageContent(msg.content, isMe)}
                                            </div>
                                            {displayTime && (
                                                <span className={`text-[9px] text-zinc-600 mt-1 block font-medium ${isMe ? 'mr-1 text-right' : 'ml-1'}`}>
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
                        <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-base shrink-0 shadow-sm">✍️</div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-zinc-500 mb-1 ml-1">
                                {Array.from(typingUsers).join(", ")} {t('isTyping')}
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
                <div className="absolute bottom-24 left-0 w-full flex justify-center z-30 animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <Button onClick={onScrollToBottom} className="bg-white/90 hover:bg-white backdrop-blur-md text-black px-6 rounded-full shadow-lg font-bold flex items-center gap-2 text-xs">
                        <span>👇</span> {t('newMessage')}
                    </Button>
                </div>
            )}

            <div className="p-4 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 shrink-0 z-20">
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
                        className="flex-1 px-5 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 disabled:opacity-50 resize-none overflow-y-auto leading-relaxed text-sm text-white placeholder:text-zinc-600 transition-colors"
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