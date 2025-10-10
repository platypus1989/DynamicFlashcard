import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Note: In-memory caching doesn't work in Vercel's serverless environment
  // Each function invocation starts fresh, so cache size is always 0
  return res.status(200).json({
    singleImageCache: 0,
    multiImageCache: 0,
    info: "Vercel serverless functions don't maintain persistent in-memory state"
  });
}

