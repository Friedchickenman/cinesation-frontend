"use client";

import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

interface ChatInputAreaProps {
    inputMessage: string;
    session: any;
    isConnected: boolean;
    roomStatus: string;
    replyingTo: any | null;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    showNewMessageBtn: boolean;
    onTyping: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onSendMessage: () => void;
    onCancelReply: () => void;
    onScrollToBottom: () => void;
}

export default function ChatInputArea({
                                          inputMessage, session, isConnected, roomStatus, replyingTo, textareaRef, showNewMessageBtn,
                                          onTyping, onKeyDown, onSendMessage, onCancelReply, onScrollToBottom
                                      }: ChatInputAreaProps) {
    const t = useTranslations("RoomDetail");
    const locale = useLocale();

    return (
        <>
            {/* 새 메시지 알림 버튼 */}
            {showNewMessageBtn && (
                <div className="absolute bottom-28 left-0 w-full flex justify-center z-30 animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <Button onClick={onScrollToBottom} className="bg-white/90 hover:bg-white backdrop-blur-md text-black px-6 rounded-full shadow-lg font-bold flex items-center gap-2 text-xs">
                        <span>👇</span> {t('newMessage')}
                    </Button>
                </div>
            )}

            <div className="relative p-4 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 shrink-0 z-20 flex flex-col">
                {/* 답장 프리뷰 */}
                {replyingTo && (
                    <div className="flex items-center justify-between bg-zinc-800/90 px-4 py-2.5 rounded-t-2xl border-t border-x border-zinc-700 text-xs w-full max-w-full truncate mb-2 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 truncate text-zinc-300">
                            <span className="text-[10px]">↩️</span>
                            <span className="font-bold text-[#00E676]">{replyingTo.sender}</span>
                            <span className="text-zinc-400">{locale === 'en' ? "Replying to" : "님에게 답장 중"}</span>
                            <span className="truncate opacity-70 ml-1">"{replyingTo.content}"</span>
                        </div>
                        <button onClick={onCancelReply} className="text-zinc-400 hover:text-white ml-2 shrink-0 bg-zinc-700/50 hover:bg-zinc-600 w-5 h-5 rounded-full flex items-center justify-center transition-colors">✕</button>
                    </div>
                )}

                {/* 입력창 */}
                <div className="flex items-end gap-3">
                    <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={onTyping}
                        onKeyDown={onKeyDown}
                        placeholder={roomStatus === 'CLOSED' ? t('placeholderClosed') : session ? t('placeholderInput') : t('placeholderLogin')}
                        disabled={!session || !isConnected || roomStatus === 'CLOSED'}
                        rows={1}
                        style={{ height: "52px", minHeight: "52px" }}
                        className={`flex-1 px-5 py-3.5 bg-zinc-950 border border-zinc-800 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 disabled:opacity-50 resize-none overflow-y-auto leading-relaxed text-sm text-white placeholder:text-zinc-600 transition-colors ${replyingTo ? 'rounded-b-2xl rounded-t-none border-t-0' : 'rounded-2xl'}`}
                    />
                    <Button
                        onClick={onSendMessage}
                        disabled={!session || !isConnected || !inputMessage.trim() || roomStatus === 'CLOSED'}
                        className="h-[52px] px-8 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-2xl disabled:opacity-50 shrink-0 transition-transform active:scale-95"
                    >
                        {t('sendBtn')}
                    </Button>
                </div>
            </div>
        </>
    );
}