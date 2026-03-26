"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl"; // 🌟 번역 훅

interface RoomActionHeaderProps {
    onExportChat: () => void;
    onCopyLink: () => void;
    isCopied: boolean;
}

export default function RoomActionHeader({ onExportChat, onCopyLink, isCopied }: RoomActionHeaderProps) {
    const router = useRouter();
    const t = useTranslations("RoomDetail"); // 🌟 번역기

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 px-2">
            <Button variant="ghost" onClick={() => router.back()} className="text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors rounded-full px-4">
                {t('backToMain')}
            </Button>
            <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={onExportChat} className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-full font-bold text-zinc-300 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white transition-colors">
                    <span>💾</span> {t('saveChat')}
                </Button>
                <Button
                    variant="outline"
                    onClick={onCopyLink}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 rounded-full font-bold transition-all ${isCopied ? "bg-[#00E676] text-black border-[#00E676] hover:bg-[#00C853]" : "text-zinc-300 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white"}`}
                >
                    {isCopied ? <><span>✅</span> {t('copied')}</> : <><span>🔗</span> {t('share')}</>}
                </Button>
            </div>
        </div>
    );
}