import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  words: z.array(z.string().trim().min(1).max(64, "Word too long")).min(1).max(50, "Maximum 50 words per curriculum"),
  curriculumName: z.string().trim().min(1).max(100, "Curriculum name too long"),
});

export type GenerateFlashcardsRequest = z.infer<typeof generateFlashcardsSchema>;

export interface Flashcard {
  word: string;
  imageUrl: string; // Kept for backward compatibility
  imageUrls?: string[]; // New field for multiple images
}

export interface GenerateFlashcardsResponse {
  flashcards: Flashcard[];
}

// Enhanced curriculum interface for local storage
export interface Curriculum {
  id: string;
  name: string;
  flashcards: Flashcard[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema for updating curricula
export const updateCurriculumSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(100, "Curriculum name too long").optional(),
  words: z.array(z.string().trim().min(1).max(64, "Word too long")).min(1).max(50, "Maximum 50 words per curriculum").optional(),
});

export type UpdateCurriculumRequest = z.infer<typeof updateCurriculumSchema>;

// Learning modes
export type LearningMode = "learning" | "test";

export interface LearningSessionConfig {
  mode: LearningMode;
  curriculum: Curriculum;
}

// For learning mode - display 3 images sequentially per word
export interface LearningModeSession {
  currentWordIndex: number;
  currentImageIndex: number;
  words: string[];
  completedWords: Set<string>;
}

// For test mode - random word and image selection
export interface TestModeSession {
  totalShown: number;
  correctAnswers: number;
  sessionHistory: Array<{
    word: string;
    imageUrl: string;
    timestamp: Date;
  }>;
}
