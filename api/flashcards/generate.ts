import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateFlashcardsSchema, type GenerateFlashcardsResponse } from '../../shared/schema';
import { searchUnsplashImages } from '../../server/unsplash';
import { ZodError } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { words, curriculumName } = generateFlashcardsSchema.parse(req.body);

    // Deduplicate words (case-insensitive)
    const uniqueWords = Array.from(
      new Set(words.map(w => w.toLowerCase()))
    ).map(w => words.find(original => original.toLowerCase() === w)!);

    console.log(`Generating flashcards for curriculum: ${curriculumName} with ${uniqueWords.length} words`);

    // Fetch multiple images with limited concurrency
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

    const response: GenerateFlashcardsResponse = {
      flashcards,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error generating flashcards:", error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      });
    } else {
      return res.status(500).json({ error: "Failed to generate flashcards" });
    }
  }
}

