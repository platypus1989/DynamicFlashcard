import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearCacheForWords, getCacheSize, getMultiCacheSize } from '../../server/unsplash';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { words } = req.body;

    if (!Array.isArray(words)) {
      return res.status(400).json({ error: "Words must be an array" });
    }

    const clearedWords = clearCacheForWords(words);

    return res.status(200).json({
      message: `Cleared cache for ${clearedWords.length} words`,
      clearedWords,
      remainingCacheSize: getCacheSize(),
      remainingMultiCacheSize: getMultiCacheSize()
    });
  } catch (error) {
    console.error("Error clearing word cache:", error);
    return res.status(500).json({ error: "Failed to clear cache" });
  }
}

