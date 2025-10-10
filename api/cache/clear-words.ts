import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { words } = req.body;

    if (!Array.isArray(words)) {
      return res.status(400).json({ error: "Words must be an array" });
    }

    // Note: In-memory caching doesn't work in Vercel's serverless environment
    // Each function invocation starts fresh, so there's no persistent cache to clear
    return res.status(200).json({
      message: "Cache clearing is not supported in serverless environment",
      clearedWords: [],
      remainingCacheSize: 0,
      remainingMultiCacheSize: 0,
      info: "Vercel serverless functions don't maintain persistent in-memory state"
    });
  } catch (error) {
    console.error("Error clearing word cache:", error);
    return res.status(500).json({ error: "Failed to clear cache" });
  }
}

