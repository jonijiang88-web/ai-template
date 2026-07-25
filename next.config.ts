import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.137"],
};

const withNextIntl = createNextIntlPlugin('./app/_lib/i18n/request.ts')

export default withNextIntl(nextConfig);
