import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  words: z.array(z.string().trim().min(1).max(64, "Word too long")).min(1).max(50, "Maximum 50 words per curriculum"),
  curriculumName: z.string().trim().min(1).max(100, "Curriculum name too long"),
});

export type GenerateFlashcardsRequest = z.infer<typeof generateFlashcardsSchema>;

export interface Flashcard {
  word: string;
  imageUrl: string;
}

export interface GenerateFlashcardsResponse {
  flashcards: Flashcard[];
}
