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
