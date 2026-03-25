import { Button } from "@/components/ui/button";

interface HeroSectionProps {
    onOpenModal: () => void;
}

export default function HeroSection({ onOpenModal }: HeroSectionProps) {
    return (
        <section className="relative w-full py-20 md:py-28 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-sm text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
                Time-Limited Lounge
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tighter leading-[1.1] mb-5 drop-shadow-lg italic">
                CINESATION.
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl font-medium leading-relaxed max-w-lg mb-10">
                영화의 여운, 가슴 벅찬 감동.<br className="hidden md:block"/> 단 7일 동안 열리는 비밀스러운 과몰입 라운지.
            </p>

            <Button
                onClick={onOpenModal}
                className="bg-white hover:bg-zinc-200 text-black font-extrabold text-xs tracking-widest uppercase px-10 py-7 rounded-full shadow-[0_4px_30px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_4px_40px_rgba(255,255,255,0.25)] hover:-translate-y-1"
            >
                Create Lounge
            </Button>
        </section>
    );
}