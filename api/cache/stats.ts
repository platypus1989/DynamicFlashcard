import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCacheSize, getMultiCacheSize } from '../../server/unsplash';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    singleImageCache: getCacheSize(),
    multiImageCache: getMultiCacheSize(),
  });
}

