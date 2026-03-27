"use client";

interface ChatPinnedNoticeProps {
    message: string;
    onUnpin: () => void;
    locale: string;
}

export default function ChatPinnedNotice({ message, onUnpin, locale }: ChatPinnedNoticeProps) {
    return (
        <div className="bg-zinc-800/95 backdrop-blur-md border-b border-zinc-700 px-6 py-3.5 flex items-start gap-3 shrink-0 z-10 shadow-lg animate-in slide-in-from-top-2">
            <span className="text-lg animate-bounce">📌</span>
            <div className="flex flex-col w-full">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-[#00E676] uppercase tracking-widest">
                        {locale === 'en' ? "Pinned Message" : "라운지 공지사항"}
                    </span>
                    <button onClick={onUnpin} className="text-[10px] font-bold text-zinc-500 hover:text-red-400 transition-colors underline underline-offset-2">
                        {locale === 'en' ? "Unpin" : "내리기"}
                    </button>
                </div>
                <span className="text-sm text-zinc-100 font-medium break-words leading-relaxed line-clamp-2">
                    {message}
                </span>
            </div>
        </div>
    );
}