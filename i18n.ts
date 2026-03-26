import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

const locales = ['ko', 'en'];

// 🌟 해결 1: 파라미터 이름을 최신 버전에 맞게 requestLocale 로 변경합니다!
export default getRequestConfig(async ({requestLocale}) => {

    // 🌟 해결 2: 프라미스(Promise) 형태이므로 await로 풀어줍니다.
    const requested = await requestLocale;
    const currentLocale = requested as string;

    // 이제 undefined가 아니므로 404 함정에 빠지지 않고 무사통과합니다!
    if (!locales.includes(currentLocale)) notFound();

    // Turbopack 에러 방지용 정적 임포트 유지
    let messages;
    if (currentLocale === 'ko') {
        messages = (await import('./messages/ko.json')).default;
    } else {
        messages = (await import('./messages/en.json')).default;
    }

    return {
        locale: currentLocale,
        messages: messages
    };
});