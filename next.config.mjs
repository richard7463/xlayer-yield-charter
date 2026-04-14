import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname
  },
  async rewrites() {
    return [
      { source: '/index.html', destination: '/' },
      { source: '/submission.html', destination: '/submission' },
      { source: '/proof-dashboard.html', destination: '/proof' },
      { source: '/control-tower.html', destination: '/proof' },
      { source: '/live-proof-latest.json', destination: '/api/live-proof' }
    ];
  }
};

export default nextConfig;
