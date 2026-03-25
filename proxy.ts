import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    // 지원하는 언어 목록
    locales: ['ko', 'en'],
    // 기본 언어 (주소에 아무것도 안 쳤을 때)
    defaultLocale: 'ko'
});

export const config = {
    // 미들웨어가 작동할 경로 (api 경로나 정적 파일은 건드리지 않게 설정)
    matcher: ['/', '/(ko|en)/:path*']
};