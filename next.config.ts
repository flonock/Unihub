import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['unzipper', 'sqlite3'],
};

export default nextConfig;
