import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateFlashcardsSchema, type GenerateFlashcardsResponse } from "@shared/schema.js";
import { searchUnsplashImages, clearCache, getCacheSize, getMultiCacheSize } from "./unsplash.js";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/flashcards/generate", async (req, res) => {
    try {
      const { words, curriculumName } = generateFlashcardsSchema.parse(req.body);

      // Deduplicate words (case-insensitive)
      const uniqueWords = Array.from(
        new Set(words.map(w => w.toLowerCase()))
      ).map(w => words.find(original => original.toLowerCase() === w)!);

      console.log(`Generating flashcards for curriculum: ${curriculumName} with ${uniqueWords.length} words (${words.length - uniqueWords.length} duplicates removed)`);

      // Fetch multiple images with limited concurrency (3 words at a time to avoid overwhelming the API)
      const CONCURRENCY_LIMIT = 3;
      const flashcards = [];

      for (let i = 0; i < uniqueWords.length; i += CONCURRENCY_LIMIT) {
        const batch = uniqueWords.slice(i, i + CONCURRENCY_LIMIT);
        const batchResults = await Promise.all(
          batch.map(async (word) => {
            const imageUrls = await searchUnsplashImages(word, 10); // Fetch up to 10 images
            return {
              word,
              imageUrl: imageUrls[0], // First image for backward compatibility
              imageUrls: imageUrls, // All images for new functionality
            };
          })
        );
        flashcards.push(...batchResults);
      }

      const response: GenerateFlashcardsResponse = {
        flashcards,
      };

      res.json(response);
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

  // Endpoint to clear image cache for specific words
  app.post("/api/cache/clear-words", async (req, res) => {
    try {
      const { words } = req.body;

      if (!Array.isArray(words)) {
        return res.status(400).json({ error: "Words must be an array" });
      }

      const clearedWords = await Promise.resolve(
        // Import the clearCacheForWords function (we'll add this)
        import("./unsplash.js").then(module =>
          module.clearCacheForWords(words)
        )
      );

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

  // Endpoint to clear all image cache
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

  // Endpoint to get cache statistics
  app.get("/api/cache/stats", (req, res) => {
    res.json({
      singleImageCache: getCacheSize(),
      multiImageCache: getMultiCacheSize(),
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
