import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    transpilePackages: ['antd', '@ant-design/icons', '@ant-design/nextjs-registry'],
    async headers() {
        return [
            {
                // Allow CORS for all API routes (needed for Electron renderer direct calls)
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Cookie' },
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                ],
            },
        ]
    },
}

export default nextConfig
