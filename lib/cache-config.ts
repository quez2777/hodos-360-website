// Cache configuration for different types of content
export const cacheConfig = {
  // Static pages with ISR
  pages: {
    home: {
      revalidate: 3600, // 1 hour
    },
    products: {
      revalidate: 7200, // 2 hours
    },
    about: {
      revalidate: 86400, // 24 hours
    },
    pricing: {
      revalidate: 3600, // 1 hour
    },
    contact: {
      revalidate: false, // No caching for contact page
    },
  },
  
  // API routes cache configuration
  api: {
    demo: {
      maxAge: 0, // No cache for demo requests
      swr: 0,
    },
    contact: {
      maxAge: 0, // No cache for contact submissions
      swr: 0,
    },
    newsletter: {
      maxAge: 300, // 5 minutes
      swr: 60, // 1 minute stale-while-revalidate
    },
    // Generic data fetching endpoints
    data: {
      maxAge: 600, // 10 minutes
      swr: 300, // 5 minutes stale-while-revalidate
    },
  },
  
  // Static assets
  assets: {
    images: {
      maxAge: 31536000, // 1 year
      immutable: true,
    },
    fonts: {
      maxAge: 31536000, // 1 year
      immutable: true,
    },
    scripts: {
      maxAge: 31536000, // 1 year
      immutable: true,
    },
  },
};

// Helper function to generate cache headers
export function getCacheHeaders(type: 'api' | 'page' | 'asset', key: string) {
  const config = cacheConfig[type as keyof typeof cacheConfig];
  const settings = (config as any)[key] || (type === 'api' ? cacheConfig.api.data : {});
  
  if (type === 'api') {
    const { maxAge = 0, swr = 0 } = settings as typeof cacheConfig.api.data;
    return {
      'Cache-Control': `s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
    };
  }
  
  if (type === 'asset') {
    const { maxAge = 0, immutable = false } = settings as typeof cacheConfig.assets.images;
    return {
      'Cache-Control': `public, max-age=${maxAge}${immutable ? ', immutable' : ''}`,
    };
  }
  
  return {
    'Cache-Control': 'no-cache',
  };
}

// ISR configuration for pages
export function getPageRevalidation(pageName: string): number | false {
  const pageConfig = (cacheConfig.pages as any)[pageName];
  return pageConfig?.revalidate ?? 3600; // Default to 1 hour
}