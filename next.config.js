/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
        styledComponents: {
            ssr: true,
            displayName: true
        }
    },
    experimental: {
        optimizePackageImports: ['phaser', 'phaser3-rex-plugins']
    },
    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate',
                    },
                    {
                        key: 'Service-Worker-Allowed',
                        value: '/',
                    },
                ],
            },
        ];
    },
    webpack: (config, options) => {
        // Handle font files
        config.module.rules.push({
            test: /\.(ttf|woff|woff2)$/,
            type: 'asset/resource',
            generator: {
                filename: 'static/fonts/[name].[hash][ext]'
            }
        });
        return config;
    }
};

module.exports = nextConfig;
