import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearCache, getCacheSize, getMultiCacheSize } from '../../server/unsplash';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    clearCache();
    return res.status(200).json({
      message: "All image cache cleared",
      cacheSize: getCacheSize(),
      multiCacheSize: getMultiCacheSize()
    });
  } catch (error) {
    console.error("Error clearing all cache:", error);
    return res.status(500).json({ error: "Failed to clear cache" });
  }
}

