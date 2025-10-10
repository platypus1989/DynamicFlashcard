import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Note: In-memory caching doesn't work in Vercel's serverless environment
  // Each function invocation starts fresh, so there's no persistent cache to clear
  return res.status(200).json({
    message: "Cache clearing is not supported in serverless environment",
    cacheSize: 0,
    multiCacheSize: 0,
    info: "Vercel serverless functions don't maintain persistent in-memory state"
  });
}

