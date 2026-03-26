import { Button } from "@/components/ui/button";
// 🌟 1. next-intl에서 번역 훅을 가져옵니다.
import { useTranslations } from "next-intl";

interface HeroSectionProps {
    onOpenModal: () => void;
}

export default function HeroSection({ onOpenModal }: HeroSectionProps) {
    // 🌟 2. JSON 파일에서 "Hero" 파트를 쓰겠다고 선언합니다.
    const t = useTranslations("Hero");

    return (
        <section className="relative w-full py-20 md:py-28 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-sm text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
                {t('badge')} {/* 🌟 3. 번역 키값 적용 */}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tighter leading-[1.1] mb-5 drop-shadow-lg italic">
                {t('title')} {/* 🌟 3. 번역 키값 적용 */}
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl font-medium leading-relaxed max-w-lg mb-10">
                {t('subtitle1')}<br className="hidden md:block"/> {t('subtitle2')} {/* 🌟 3. 번역 키값 적용 */}
            </p>

            <Button
                onClick={onOpenModal}
                className="bg-white hover:bg-zinc-200 text-black font-extrabold text-xs tracking-widest uppercase px-10 py-7 rounded-full shadow-[0_4px_30px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_4px_40px_rgba(255,255,255,0.25)] hover:-translate-y-1"
            >
                {t('createBtn')} {/* 🌟 3. 번역 키값 적용 */}
            </Button>
        </section>
    );
}