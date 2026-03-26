import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string, locale: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const roomId = resolvedParams.id;
    const locale = resolvedParams.locale;

    // 현재 언어에 맞는 TMDB 언어 파라미터 설정
    const tmdbLang = locale === 'en' ? 'en-US' : 'ko-KR';

    try {
        // 1. 백엔드에서 방 정보 가져오기
        const res = await fetch(`http://localhost:8080/api/rooms/${roomId}`);
        if (!res.ok) throw new Error("Room not found");
        const roomData = await res.json();

        // 2. TMDB에서 고화질 포스터/배경 이미지 가져오기
        let imageUrl = "";
        if (roomData.movieId && !roomData.movieId.startsWith("m_")) {
            const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
            const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${roomData.movieId}?language=${tmdbLang}&api_key=${apiKey}`);
            if (tmdbRes.ok) {
                const tmdbData = await tmdbRes.json();
                // OG 태그용으로는 가로로 넓은 backdrop 이미지가 예쁩니다. 없으면 포스터 사용!
                if (tmdbData.backdrop_path) {
                    imageUrl = `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}`;
                } else if (tmdbData.poster_path) {
                    imageUrl = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
                }
            }
        }

        // 3. 다이내믹 메타데이터 반환
        return {
            title: `CineSation | ${roomData.title}`,
            description: locale === 'en'
                ? `Join ${roomData.creatorName}'s immersive movie lounge!`
                : `호스트 ${roomData.creatorName}님의 과몰입 라운지에 참여하세요!`,
            openGraph: {
                title: `${roomData.title} | CineSation`,
                description: locale === 'en'
                    ? `A secret discussion lounge open for only 7 days. Join now!`
                    : `단 7일간 열리는 비밀스러운 토론 라운지. 지금 바로 참여하세요!`,
                images: imageUrl ? [imageUrl] : [],
                type: 'website',
            },
        };
    } catch (error) {
        return {
            title: "CineSation",
            description: "영화의 여운을 나누는 비밀스러운 라운지",
        };
    }
}

// 레이아웃 본체는 단순히 자식(page.tsx)을 렌더링만 합니다.
export default function RoomDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}