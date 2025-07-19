import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  typescript: {
    // Don't fail build on TS errors during deployment
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
