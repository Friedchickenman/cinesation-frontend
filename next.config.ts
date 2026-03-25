import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 🌟 에러 해결: 괄호 안에 우리가 만든 i18n.ts 파일의 경로를 명확히 적어줍니다!
const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
    /* config options here */
};

// 🌟 기존 nextConfig를 withNextIntl로 감싸서 내보냅니다.
export default withNextIntl(nextConfig);