import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "@/app/globals.css";
import Link from "next/link";
import Providers from "./Providers";
import AuthButton from "@/components/AuthButton";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

// 🌟 1. 다국어 처리를 위한 next-intl 라이브러리 임포트
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CineSation - 타임 리밋 무비 커뮤니티",
    description: "영화의 감동을 나누는 가장 완벽한 7일",
};

// 🌟 2. 파라미터로 현재 언어(locale)를 받아옵니다. (Next.js 15 호환 Promise 처리)
export default async function RootLayout({
                                             children,
                                             params
                                         }: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    // 파라미터에서 현재 언어(ko 또는 en) 추출
    const resolvedParams = await params;
    const locale = resolvedParams.locale;

    // 🌟 3. 서버에서 현재 언어에 맞는 사전(messages/ko.json 등)을 불러옵니다.
    const messages = await getMessages();

    return (
        // 🌟 4. html의 lang 속성도 유저의 접속 언어에 맞게 동적으로 바뀝니다!
        <html lang={locale} className={cn("font-sans", geist.variable)}>
        <body className={`${inter.className} bg-[#09090B] text-zinc-100 antialiased`}>

        {/* 🌟 5. NextIntlClientProvider로 전체 앱을 감싸서 번역본을 하위 컴포넌트에 내려줍니다. */}
        <NextIntlClientProvider messages={messages}>
            <Providers>
                <header className="sticky top-0 z-50 w-full bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-800 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* next-intl 환경에서는 '/'로 이동하면 알아서 현재 언어의 홈으로 갑니다 */}
                            <Link href="/" className="flex items-center gap-2 group">
                                <span className="text-2xl transition-transform group-hover:scale-110">🎬</span>
                                <span className="text-xl font-extrabold tracking-tight text-white">
                                    Cine<span className="text-zinc-500">Sation</span>
                                </span>
                            </Link>
                            <div className="flex items-center gap-4">
                                {/* 🌐 추후 이 위치에 언어 변경(한/영) 토글 버튼을 넣을 예정입니다 */}
                                <AuthButton />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
            </Providers>
        </NextIntlClientProvider>

        <Toaster position="bottom-right" richColors theme="dark" />
        </body>
        </html>
    );
}