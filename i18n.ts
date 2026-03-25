import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

const locales = ['ko', 'en'];

export default getRequestConfig(async ({locale}) => {
    const currentLocale = locale as string;

    if (!locales.includes(currentLocale)) notFound();

    // 🌟 해결: Turbopack이 헷갈리지 않도록 변수(${ })를 빼고 직접 경로를 지정해줍니다!
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