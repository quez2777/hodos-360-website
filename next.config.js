/** @type {import('next').NextConfig} */
const path = require('path');

// Only require bundle analyzer if ANALYZE is set and package is available
let withBundleAnalyzer;
try {
  if (process.env.ANALYZE === 'true') {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
  }
} catch (error) {
  // Bundle analyzer not available, use identity function
  withBundleAnalyzer = (config) => config;
}

// Default to identity function if not analyzing
withBundleAnalyzer = withBundleAnalyzer || ((config) => config);

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    
    // Remove React properties in production
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-testid$'],
    } : false,
    
    // Dead code elimination
    emotion: true,
  },
  
  // Enhanced modularizeImports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
    '@radix-ui/react-accordion': {
      transform: '@radix-ui/react-accordion/dist/{{member}}',
    },
    '@radix-ui/react-alert-dialog': {
      transform: '@radix-ui/react-alert-dialog/dist/{{member}}',
    },
    '@radix-ui/react-aspect-ratio': {
      transform: '@radix-ui/react-aspect-ratio/dist/{{member}}',
    },
    '@radix-ui/react-avatar': {
      transform: '@radix-ui/react-avatar/dist/{{member}}',
    },
    '@radix-ui/react-checkbox': {
      transform: '@radix-ui/react-checkbox/dist/{{member}}',
    },
    '@radix-ui/react-collapsible': {
      transform: '@radix-ui/react-collapsible/dist/{{member}}',
    },
    '@radix-ui/react-context-menu': {
      transform: '@radix-ui/react-context-menu/dist/{{member}}',
    },
    '@radix-ui/react-dialog': {
      transform: '@radix-ui/react-dialog/dist/{{member}}',
    },
    '@radix-ui/react-dropdown-menu': {
      transform: '@radix-ui/react-dropdown-menu/dist/{{member}}',
    },
    '@radix-ui/react-hover-card': {
      transform: '@radix-ui/react-hover-card/dist/{{member}}',
    },
    '@radix-ui/react-label': {
      transform: '@radix-ui/react-label/dist/{{member}}',
    },
    '@radix-ui/react-menubar': {
      transform: '@radix-ui/react-menubar/dist/{{member}}',
    },
    '@radix-ui/react-navigation-menu': {
      transform: '@radix-ui/react-navigation-menu/dist/{{member}}',
    },
    '@radix-ui/react-popover': {
      transform: '@radix-ui/react-popover/dist/{{member}}',
    },
    '@radix-ui/react-progress': {
      transform: '@radix-ui/react-progress/dist/{{member}}',
    },
    '@radix-ui/react-radio-group': {
      transform: '@radix-ui/react-radio-group/dist/{{member}}',
    },
    '@radix-ui/react-scroll-area': {
      transform: '@radix-ui/react-scroll-area/dist/{{member}}',
    },
    '@radix-ui/react-select': {
      transform: '@radix-ui/react-select/dist/{{member}}',
    },
    '@radix-ui/react-separator': {
      transform: '@radix-ui/react-separator/dist/{{member}}',
    },
    '@radix-ui/react-slider': {
      transform: '@radix-ui/react-slider/dist/{{member}}',
    },
    '@radix-ui/react-switch': {
      transform: '@radix-ui/react-switch/dist/{{member}}',
    },
    '@radix-ui/react-tabs': {
      transform: '@radix-ui/react-tabs/dist/{{member}}',
    },
    '@radix-ui/react-toast': {
      transform: '@radix-ui/react-toast/dist/{{member}}',
    },
    '@radix-ui/react-toggle': {
      transform: '@radix-ui/react-toggle/dist/{{member}}',
    },
    '@radix-ui/react-toggle-group': {
      transform: '@radix-ui/react-toggle-group/dist/{{member}}',
    },
    '@radix-ui/react-tooltip': {
      transform: '@radix-ui/react-tooltip/dist/{{member}}',
    },
  },
  
  // Image optimization improvements
  images: {
    domains: ['localhost', 'hodos360.com', 'cdn.hodos360.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Enable ISR and optimization features
  experimental: {
    optimizeCss: true,
    webpackBuildWorker: true,
    optimizePackageImports: ['framer-motion', '@headlessui/react', 'clsx', 'tailwind-merge'],
  },
  
  // ISR cache configuration
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  
  // Webpack configuration for better chunking
  webpack: (config, { dev, isServer }) => {
    // Add path aliases
    const path = require('path');
    Object.assign(config.resolve.alias, {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/app': path.resolve(__dirname, './app'),
      '@/types': path.resolve(__dirname, './types'),
      '@/hooks': path.resolve(__dirname, './hooks'),
    });

    // Production optimizations
    if (!dev && !isServer) {
      // Replace react with preact in production
      Object.assign(config.resolve.alias, {
        'react/jsx-runtime.js': 'preact/compat/jsx-runtime',
        react: 'preact/compat',
        'react-dom': 'preact/compat',
      });
      
      // Optimize chunks
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store|preact)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Library chunk
            lib: {
              test(module) {
                return module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                const hash = require('crypto')
                  .createHash('sha1')
                  .update(module.identifier())
                  .digest('hex')
                  .substring(0, 8);
                return `lib-${hash}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Commons chunk
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              priority: 20,
            },
            // Shared chunks
            shared: {
              name(module, chunks) {
                const hash = require('crypto')
                  .createHash('sha1')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex')
                  .substring(0, 8);
                return `shared-${hash}`;
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
        minimize: true,
      };
      
      // Add bundle analyzer
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './analyze.html',
            generateStatsFile: true,
            openAnalyzer: false,
          })
        );
      }
    }
    
    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
  
  // Headers configuration
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      // Static asset caching
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Image caching
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // JS/CSS caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Font caching
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes with short cache
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=10, stale-while-revalidate=59',
          },
        ],
      },
    ];
  },
  
  // Redirects for performance
  redirects: async () => {
    return [
      // Redirect trailing slashes
      {
        source: '/:path*/',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
  
  // Output configuration
  output: 'standalone',
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://hodos360.com',
  },
};

module.exports = withBundleAnalyzer(nextConfig);