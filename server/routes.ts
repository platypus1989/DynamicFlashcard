import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateFlashcardsSchema, type GenerateFlashcardsResponse } from "@shared/schema.js";
import { searchUnsplashImage } from "./unsplash.js";
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

      // Fetch images with limited concurrency (5 at a time)
      const CONCURRENCY_LIMIT = 5;
      const flashcards = [];

      for (let i = 0; i < uniqueWords.length; i += CONCURRENCY_LIMIT) {
        const batch = uniqueWords.slice(i, i + CONCURRENCY_LIMIT);
        const batchResults = await Promise.all(
          batch.map(async (word) => ({
            word,
            imageUrl: await searchUnsplashImage(word),
          }))
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

  const httpServer = createServer(app);

  return httpServer;
}
