import axios from "axios";

const UNSPLASH_API_URL = "https://api.unsplash.com";
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!ACCESS_KEY) {
  console.warn("⚠️  UNSPLASH_ACCESS_KEY not set - will use placeholder images");
}

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  user: {
    name: string;
    username: string;
  };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

// Simple LRU cache with max size
const MAX_CACHE_SIZE = 500;
const imageCache = new Map<string, string>();

function cacheGet(key: string): string | undefined {
  const value = imageCache.get(key);
  if (value) {
    // Move to end (LRU)
    imageCache.delete(key);
    imageCache.set(key, value);
  }
  return value;
}

function cacheSet(key: string, value: string): void {
  // Remove oldest if at capacity
  if (imageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = imageCache.keys().next().value;
    if (firstKey) {
      imageCache.delete(firstKey);
      console.log(`Cache evicted: ${firstKey} (size: ${imageCache.size})`);
    }
  }
  imageCache.set(key, value);
}

export async function searchUnsplashImage(query: string): Promise<string> {
  // Check cache first
  const cached = cacheGet(query.toLowerCase());
  if (cached) {
    console.log(`Cache hit for word: ${query}`);
    return cached;
  }

  // If no API key, return placeholder immediately
  if (!ACCESS_KEY) {
    const fallbackUrl = `https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=${encodeURIComponent(query)}`;
    cacheSet(query.toLowerCase(), fallbackUrl);
    return fallbackUrl;
  }

  console.log(`Fetching image from Unsplash for word: ${query}`);

  try {
    const response = await axios.get<UnsplashSearchResponse>(
      `${UNSPLASH_API_URL}/search/photos`,
      {
        params: {
          query,
          per_page: 1,
          orientation: "landscape",
        },
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`,
        },
        timeout: 5000, // 5 second timeout
      }
    );

    if (response.data.results.length > 0) {
      const imageUrl = response.data.results[0].urls.regular;
      
      // Cache the result
      cacheSet(query.toLowerCase(), imageUrl);
      console.log(`Cached image for word: ${query} (cache size: ${imageCache.size})`);
      
      return imageUrl;
    } else {
      // Fallback to a placeholder if no image found
      const fallbackUrl = `https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=${encodeURIComponent(query)}`;
      cacheSet(query.toLowerCase(), fallbackUrl);
      return fallbackUrl;
    }
  } catch (error) {
    console.error(`Error fetching image for "${query}":`, error);
    
    // Return fallback on error
    const fallbackUrl = `https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=${encodeURIComponent(query)}`;
    cacheSet(query.toLowerCase(), fallbackUrl);
    return fallbackUrl;
  }
}

export function getCacheSize(): number {
  return imageCache.size;
}

export function clearCache(): void {
  imageCache.clear();
  console.log("Image cache cleared");
}
