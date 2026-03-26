import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    locales: ['ko', 'en'],
    defaultLocale: 'ko'
});

export const config = {
    // 🌟 싹 다 낚아채는 만능 마처 (단, api나 정적 이미지 파일 등은 제외)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};