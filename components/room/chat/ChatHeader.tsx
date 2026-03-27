"use client";

import { useTranslations } from "next-intl";

interface ChatHeaderProps {
    isConnected: boolean;
}

export default function ChatHeader({ isConnected }: ChatHeaderProps) {
    const t = useTranslations("RoomDetail");

    return (
        <div className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0 z-20">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm tracking-wide">
                <span className="opacity-80">💬</span> {t('liveLounge')}
            </h3>
            <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full flex items-center gap-2 border ${isConnected ? 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30' : 'bg-red-900/20 text-red-500 border-red-900/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#00E676] animate-pulse' : 'bg-red-500'}`}></span>
                {isConnected ? t('connected') : t('reconnecting')}
            </span>
        </div>
    );
}