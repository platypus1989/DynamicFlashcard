import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

// Inline schema definition to avoid import issues
const generateFlashcardsSchema = z.object({
  words: z.array(z.string().trim().min(1).max(64, "Word too long")).min(1).max(50, "Maximum 50 words per curriculum"),
  curriculumName: z.string().trim().min(1).max(100, "Curriculum name too long"),
});

interface PhotoAttribution {
  photographerName: string;
  photographerUsername: string;
  photoId: string;
  photoUrl: string;
}

interface PhotoMetadata {
  url: string;
  photographerName: string;
  photographerUsername: string;
  photoId: string;
  photoUrl: string;
}

interface Flashcard {
  word: string;
  imageUrl: string;
  imageUrls?: string[];
  photoAttributions?: PhotoAttribution[];
}

interface GenerateFlashcardsResponse {
  flashcards: Flashcard[];
}

// Unsplash API configuration
const UNSPLASH_API_URL = "https://api.unsplash.com";
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

/**
 * Search for multiple images for a word (up to 10) with photographer attribution
 */
async function searchUnsplashImages(query: string, maxImages: number = 10): Promise<PhotoMetadata[]> {
  // If no API key, return empty array
  if (!ACCESS_KEY) {
    console.warn(`No Unsplash API key - returning empty array for: ${query}`);
    return [];
  }

  console.log(`Fetching ${maxImages} images from Unsplash for word: ${query}`);

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=${maxImages}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`,
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      console.error(`Unsplash API error for "${query}": ${response.status} ${response.statusText}`);
      return [];
    }

    const data: UnsplashSearchResponse = await response.json();

    if (data.results.length > 0) {
      const photoMetadata: PhotoMetadata[] = data.results.map(photo => ({
        url: photo.urls.regular,
        photographerName: photo.user.name,
        photographerUsername: photo.user.username,
        photoId: photo.id,
        photoUrl: photo.links.html,
      }));

      console.log(`Found ${photoMetadata.length} images for word: ${query}`);
      return photoMetadata;
    } else {
      console.warn(`No images found for: ${query}`);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching images for "${query}":`, error);
    return [];
  }
}

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
          const photoMetadata = await searchUnsplashImages(word, 10);
          return {
            word,
            imageUrl: photoMetadata[0]?.url || '',
            imageUrls: photoMetadata.map(p => p.url),
            photoAttributions: photoMetadata.map(p => ({
              photographerName: p.photographerName,
              photographerUsername: p.photographerUsername,
              photoId: p.photoId,
              photoUrl: p.photoUrl,
            })),
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

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      });
    } else {
      return res.status(500).json({ 
        error: "Failed to generate flashcards",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}

