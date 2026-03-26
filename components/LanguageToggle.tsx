"use client";

import { usePathname, useRouter } from "next/navigation";

export default function LanguageToggle() {
    const pathname = usePathname();
    const router = useRouter();

    const toggleLanguage = () => {
        if (!pathname) return;

        // 현재 주소가 /en으로 시작하는지 확인하여 현재 언어 파악
        const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko';
        const nextLocale = currentLocale === 'ko' ? 'en' : 'ko';

        // 주소의 첫 부분(/ko 또는 /en)을 반대 언어로 교체해서 이동
        const newPath = pathname.replace(`/${currentLocale}`, `/${nextLocale}`);
        router.push(newPath);
    };

    const isKorean = !pathname?.startsWith('/en');

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shadow-sm"
        >
            <span className="text-sm">🌐</span>
            <span>{isKorean ? 'EN' : 'KO'}</span>
        </button>
    );
}