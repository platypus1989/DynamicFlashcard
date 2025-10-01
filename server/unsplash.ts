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

// Simple LRU cache with max size for single images (backward compatibility)
const MAX_CACHE_SIZE = 500;
const imageCache = new Map<string, string>();

// LRU cache for multiple images
const multiImageCache = new Map<string, string[]>();

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

function multiCacheGet(key: string): string[] | undefined {
  const value = multiImageCache.get(key);
  if (value) {
    // Move to end (LRU)
    multiImageCache.delete(key);
    multiImageCache.set(key, value);
  }
  return value;
}

function multiCacheSet(key: string, value: string[]): void {
  // Remove oldest if at capacity
  if (multiImageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = multiImageCache.keys().next().value;
    if (firstKey) {
      multiImageCache.delete(firstKey);
      console.log(`Multi-image cache evicted: ${firstKey} (size: ${multiImageCache.size})`);
    }
  }
  multiImageCache.set(key, value);
}

// Note: Placeholder generation removed - we now skip words without images entirely
// Placeholders should only be used in the frontend as a last-resort fallback for display

/**
 * Search for multiple images for a word (up to 10)
 */
export async function searchUnsplashImages(query: string, maxImages: number = 10, forceRefresh: boolean = false): Promise<string[]> {
  // Check cache first (unless force refresh is requested)
  if (!forceRefresh) {
    const cached = multiCacheGet(query.toLowerCase());
    if (cached) {
      console.log(`Multi-image cache hit for word: ${query} (${cached.length} images)`);
      return cached.slice(0, maxImages);
    }
  } else {
    console.log(`Force refresh requested for word: ${query} - bypassing cache`);
    // Clear existing cache entries for this word
    clearCacheForWords([query]);
  }

  // If no API key, return empty array (no placeholders should be stored)
  if (!ACCESS_KEY) {
    console.warn(`No Unsplash API key - returning empty array for: ${query}`);
    return [];
  }

  console.log(`Fetching ${maxImages} images from Unsplash for word: ${query}${forceRefresh ? ' (force refresh)' : ''}`);

  try {
    const response = await axios.get<UnsplashSearchResponse>(
      `${UNSPLASH_API_URL}/search/photos`,
      {
        params: {
          query,
          per_page: maxImages,
          orientation: "landscape",
        },
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`,
        },
        timeout: 10000, // 10 second timeout for multiple images
      }
    );

    if (response.data.results.length > 0) {
      const imageUrls = response.data.results.map(photo => photo.urls.regular);

      // Cache the results
      multiCacheSet(query.toLowerCase(), imageUrls);
      console.log(`Cached ${imageUrls.length} images for word: ${query} (cache size: ${multiImageCache.size})`);

      return imageUrls;
    } else {
      // No images found - return empty array (don't store placeholders)
      console.warn(`No images found for: ${query}`);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching images for "${query}":`, error);

    // Return empty array on error (don't store placeholders)
    return [];
  }
}

/**
 * Legacy function for single image (backward compatibility)
 * Now prioritizes multi-image cache to ensure multiple images are available
 */
export async function searchUnsplashImage(query: string): Promise<string> {
  // Try to get from multi-image cache FIRST
  const multiCached = multiCacheGet(query.toLowerCase());
  if (multiCached && multiCached.length > 0) {
    console.log(`Using first image from multi-cache for word: ${query} (${multiCached.length} total images available)`);
    return multiCached[0];
  }

  // Check single image cache as fallback (for very old cached items)
  const cached = cacheGet(query.toLowerCase());
  if (cached) {
    console.log(`Single-image cache hit for word: ${query} - will upgrade to multi-image`);
    // Don't return cached single image - instead fetch multiple images to upgrade the cache
    // This ensures we get multiple images even for previously cached words
  }

  // If no API key, return placeholder URL (but don't cache it)
  if (!ACCESS_KEY) {
    console.warn(`No Unsplash API key - returning placeholder for: ${query}`);
    return `https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=${encodeURIComponent(query)}`;
  }

  console.log(`Fetching multiple images from Unsplash for word: ${query} (upgrading single-image cache)`);

  try {
    // Fetch multiple images instead of just one
    const imageUrls = await searchUnsplashImages(query, 10);
    if (imageUrls.length > 0) {
      return imageUrls[0]; // Return first image but ensure multiple are cached
    } else {
      // No images found - return placeholder (but don't cache it)
      return `https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=${encodeURIComponent(query)}`;
    }
  } catch (error) {
    console.error(`Error fetching image for "${query}":`, error);

    // Return placeholder on error (but don't cache it)
    return `https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=${encodeURIComponent(query)}`;
  }
}

export function getCacheSize(): number {
  return imageCache.size;
}

export function getMultiCacheSize(): number {
  return multiImageCache.size;
}

export function clearCache(): void {
  imageCache.clear();
  multiImageCache.clear();
  console.log("Image caches cleared");
}

export function clearCacheForWords(words: string[]): string[] {
  const clearedWords: string[] = [];

  words.forEach(word => {
    const lowerWord = word.toLowerCase();

    // Clear from single image cache
    if (imageCache.has(lowerWord)) {
      imageCache.delete(lowerWord);
      clearedWords.push(word);
    }

    // Clear from multi-image cache
    if (multiImageCache.has(lowerWord)) {
      multiImageCache.delete(lowerWord);
      if (!clearedWords.includes(word)) {
        clearedWords.push(word);
      }
    }
  });

  if (clearedWords.length > 0) {
    console.log(`Cleared cache for words: ${clearedWords.join(', ')}`);
  }

  return clearedWords;
}
