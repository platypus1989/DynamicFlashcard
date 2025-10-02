// Vercel serverless function entry point
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { generateFlashcardsSchema } from '../shared/schema.js';
import { searchUnsplashImages, clearCache, getCacheSize, getMultiCacheSize, clearCacheForWords } from '../server/unsplash.js';
import { ZodError } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app;
let initialized = false;

async function initializeApp() {
  if (initialized) return app;
  
  app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // API routes
  app.post("/api/flashcards/generate", async (req, res) => {
    try {
      const { words, curriculumName } = generateFlashcardsSchema.parse(req.body);

      const uniqueWords = Array.from(
        new Set(words.map(w => w.toLowerCase()))
      ).map(w => words.find(original => original.toLowerCase() === w));

      console.log(`Generating flashcards for curriculum: ${curriculumName} with ${uniqueWords.length} words`);

      const CONCURRENCY_LIMIT = 3;
      const flashcards = [];

      for (let i = 0; i < uniqueWords.length; i += CONCURRENCY_LIMIT) {
        const batch = uniqueWords.slice(i, i + CONCURRENCY_LIMIT);
        const batchResults = await Promise.all(
          batch.map(async (word) => {
            const imageUrls = await searchUnsplashImages(word, 10);
            return {
              word,
              imageUrl: imageUrls[0],
              imageUrls: imageUrls,
            };
          })
        );
        flashcards.push(...batchResults);
      }

      res.json({ flashcards });
    } catch (error) {
      console.error("Error generating flashcards:", error);

      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request",
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        });
      } else {
        res.status(500).json({ error: "Failed to generate flashcards" });
      }
    }
  });

  app.post("/api/cache/clear-words", async (req, res) => {
    try {
      const { words } = req.body;

      if (!Array.isArray(words)) {
        return res.status(400).json({ error: "Words must be an array" });
      }

      const clearedWords = await clearCacheForWords(words);

      res.json({
        message: `Cleared cache for ${clearedWords.length} words`,
        clearedWords,
        remainingCacheSize: getCacheSize(),
        remainingMultiCacheSize: getMultiCacheSize()
      });
    } catch (error) {
      console.error("Error clearing word cache:", error);
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  app.post("/api/cache/clear-all", async (req, res) => {
    try {
      clearCache();
      res.json({
        message: "All image cache cleared",
        cacheSize: getCacheSize(),
        multiCacheSize: getMultiCacheSize()
      });
    } catch (error) {
      console.error("Error clearing all cache:", error);
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  app.get("/api/cache/stats", (req, res) => {
    res.json({
      singleImageCache: getCacheSize(),
      multiImageCache: getMultiCacheSize(),
    });
  });

  // Serve static files from dist/public
  const distPath = path.resolve(__dirname, '..', 'dist', 'public');
  app.use(express.static(distPath));

  // Serve index.html for all other routes (SPA fallback)
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });

  initialized = true;
  return app;
}

// Export handler for Vercel
export default async function handler(req, res) {
  const app = await initializeApp();
  return app(req, res);
}

