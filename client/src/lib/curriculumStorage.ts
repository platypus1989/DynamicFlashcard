import type { Curriculum, Flashcard } from "@shared/schema";
import { findNewWords } from "./wordUtils";

const STORAGE_KEY = "dynamic-flashcard-curricula";

export class CurriculumStorage {
  /**
   * Load all curricula from localStorage
   */
  static loadCurricula(): Curriculum[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((curriculum: any) => ({
        ...curriculum,
        createdAt: new Date(curriculum.createdAt),
        updatedAt: new Date(curriculum.updatedAt),
      }));
    } catch (error) {
      console.error("Error loading curricula from localStorage:", error);
      return [];
    }
  }

  /**
   * Save all curricula to localStorage
   */
  static saveCurricula(curricula: Curriculum[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(curricula));
    } catch (error) {
      console.error("Error saving curricula to localStorage:", error);
      throw new Error("Failed to save curricula. Storage may be full.");
    }
  }

  /**
   * Add a new curriculum
   */
  static addCurriculum(curriculum: Omit<Curriculum, "id" | "createdAt" | "updatedAt">): Curriculum {
    const curricula = this.loadCurricula();
    const now = new Date();

    const newCurriculum: Curriculum = {
      ...curriculum,
      id: `curriculum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    const updatedCurricula = [newCurriculum, ...curricula];
    this.saveCurricula(updatedCurricula);

    return newCurriculum;
  }

  /**
   * Update an existing curriculum
   */
  static updateCurriculum(id: string, updates: Partial<Pick<Curriculum, "name" | "flashcards">>): Curriculum | null {
    const curricula = this.loadCurricula();
    const index = curricula.findIndex(c => c.id === id);

    if (index === -1) {
      console.warn(`Curriculum with id ${id} not found`);
      return null;
    }

    const updatedCurriculum = {
      ...curricula[index],
      ...updates,
      updatedAt: new Date(),
    };

    curricula[index] = updatedCurriculum;
    this.saveCurricula(curricula);

    return updatedCurriculum;
  }

  /**
   * Delete a curriculum and clear its cached images
   */
  static async deleteCurriculum(id: string): Promise<boolean> {
    const curriculum = this.getCurriculum(id);
    if (!curriculum) {
      console.warn(`Curriculum with id ${id} not found`);
      return false;
    }

    // Extract words from the curriculum to clear cache
    const words = curriculum.flashcards.map(fc => fc.word);

    // Clear the curriculum from localStorage
    const curricula = this.loadCurricula();
    const filteredCurricula = curricula.filter(c => c.id !== id);

    if (filteredCurricula.length === curricula.length) {
      console.warn(`Curriculum with id ${id} not found`);
      return false;
    }

    this.saveCurricula(filteredCurricula);

    // Clear server-side cache for the words in this curriculum
    try {
      await fetch("/api/cache/clear-words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ words }),
      });
      console.log(`Cleared server cache for ${words.length} words from deleted curriculum: ${curriculum.name}`);
    } catch (error) {
      console.warn("Failed to clear server cache for deleted curriculum words:", error);
      // Don't fail the deletion if cache clearing fails
    }

    return true;
  }

  /**
   * Get a specific curriculum by ID
   */
  static getCurriculum(id: string): Curriculum | null {
    const curricula = this.loadCurricula();
    return curricula.find(c => c.id === id) || null;
  }

  /**
   * Add words to an existing curriculum
   * This method:
   * 1. Deduplicates new words against existing ones
   * 2. Queries Unsplash API to fetch images for truly new words
   * 3. Stores the complete flashcards (words + images + attributions) in the curriculum
   * 
   * @param id - Curriculum ID
   * @param newWords - Array of words to add
   * @returns Updated curriculum or null if not found
   */
  static async addWordsToCurriculum(id: string, newWords: string[]): Promise<Curriculum | null> {
    const curriculum = this.getCurriculum(id);
    if (!curriculum) {
      console.warn(`Curriculum with id ${id} not found`);
      return null;
    }

    // Step 1: Deduplicate new words against existing ones using centralized utility
    const currentWords = curriculum.flashcards.map(fc => fc.word);
    const uniqueNewWords = findNewWords(newWords, currentWords);

    if (uniqueNewWords.length === 0) {
      console.log("No new unique words to add");
      return curriculum;
    }

    console.log(`Adding ${uniqueNewWords.length} new words to curriculum "${curriculum.name}"`);

    try {
      // Step 2: Query Unsplash API to fetch images for new words
      // The API endpoint will handle fetching images and creating flashcards
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          words: uniqueNewWords,
          curriculumName: curriculum.name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if it's the API key error
        if (errorData.error === "Unsplash API key not configured") {
          throw new Error(
            "Unsplash API key not configured. " +
            "Please set UNSPLASH_ACCESS_KEY in Vercel environment variables."
          );
        }
        
        throw new Error(errorData.message || "Failed to generate flashcards for new words");
      }

      const data = await response.json();
      const newFlashcards: Flashcard[] = data.flashcards;

      console.log(`Successfully fetched images for ${newFlashcards.length} new words`);

      // Step 3: Combine existing and new flashcards, then store in curriculum
      const updatedFlashcards = [...curriculum.flashcards, ...newFlashcards];

      return this.updateCurriculum(id, { flashcards: updatedFlashcards });
    } catch (error) {
      console.error("Error adding words to curriculum:", error);
      throw error;
    }
  }

  /**
   * Remove words from a curriculum
   */
  static removeWordsFromCurriculum(id: string, wordsToRemove: string[]): Curriculum | null {
    const curriculum = this.getCurriculum(id);
    if (!curriculum) {
      console.warn(`Curriculum with id ${id} not found`);
      return null;
    }

    const wordsToRemoveLower = wordsToRemove.map(w => w.toLowerCase());
    const updatedFlashcards = curriculum.flashcards.filter(fc =>
      !wordsToRemoveLower.includes(fc.word.toLowerCase())
    );

    if (updatedFlashcards.length === 0) {
      console.warn("Cannot remove all words from curriculum");
      return null;
    }

    return this.updateCurriculum(id, { flashcards: updatedFlashcards });
  }

  /**
   * Clear all curricula (for testing/reset purposes)
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing curricula:", error);
    }
  }

  /**
   * Permanently remove a specific image from a flashcard
   * Once deleted, the image will never be selected again for that word.
   * 
   * @param curriculumId - Curriculum ID
   * @param word - Word whose image should be removed
   * @param imageIndex - Index of the image to remove
   * @returns Updated curriculum or null if not found/invalid
   */
  static removeImageFromFlashcard(
    curriculumId: string,
    word: string,
    imageIndex: number
  ): Curriculum | null {
    const curriculum = this.getCurriculum(curriculumId);
    if (!curriculum) {
      console.warn(`Curriculum with id ${curriculumId} not found`);
      return null;
    }

    const flashcardIndex = curriculum.flashcards.findIndex(
      fc => fc.word.toLowerCase() === word.toLowerCase()
    );

    if (flashcardIndex === -1) {
      console.warn(`Flashcard with word "${word}" not found in curriculum`);
      return null;
    }

    const flashcard = curriculum.flashcards[flashcardIndex];
    const imageUrls = flashcard.imageUrls || [flashcard.imageUrl];
    const photoAttributions = flashcard.photoAttributions || [];

    if (imageIndex < 0 || imageIndex >= imageUrls.length) {
      console.warn(`Invalid image index ${imageIndex} for word "${word}"`);
      return null;
    }

    // Ensure at least one image will remain after deletion
    if (imageUrls.length <= 1) {
      console.warn(`Cannot remove the last image from word "${word}"`);
      return null;
    }

    // Remove the image and its attribution permanently
    const newImageUrls = [...imageUrls];
    const newPhotoAttributions = [...photoAttributions];
    
    newImageUrls.splice(imageIndex, 1);
    if (newPhotoAttributions[imageIndex]) {
      newPhotoAttributions.splice(imageIndex, 1);
    }

    // Update the flashcard
    const updatedFlashcard = {
      ...flashcard,
      imageUrl: newImageUrls[0], // Keep backward compatibility
      imageUrls: newImageUrls,
      photoAttributions: newPhotoAttributions,
    };

    const updatedFlashcards = [...curriculum.flashcards];
    updatedFlashcards[flashcardIndex] = updatedFlashcard;

    console.log(`Permanently deleted image ${imageIndex} for word "${word}". ${newImageUrls.length} images remaining.`);
    return this.updateCurriculum(curriculumId, { flashcards: updatedFlashcards });
  }

  /**
   * Clear all server-side image cache
   */
  static async clearAllCache(): Promise<boolean> {
    try {
      const response = await fetch("/api/cache/clear-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to clear server cache");
      }

      const result = await response.json();
      console.log("Server cache cleared:", result);
      return true;
    } catch (error) {
      console.error("Failed to clear server cache:", error);
      return false;
    }
  }

  /**
   * Export a single curriculum as JSON in the format compatible with curricula_data files
   * This format excludes the 'id' field since it's local-specific.
   * 
   * @param id - Curriculum ID to export
   * @returns JSON string of the curriculum or null if not found
   */
  static exportCurriculum(id: string): string | null {
    const curriculum = this.getCurriculum(id);
    if (!curriculum) {
      console.warn(`Curriculum with id ${id} not found`);
      return null;
    }

    // Export in the same format as curricula_data files (without the id field)
    const exportData = {
      name: curriculum.name,
      flashcards: curriculum.flashcards,
      createdAt: curriculum.createdAt,
      updatedAt: curriculum.updatedAt,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export curricula as JSON (for backup)
   */
  static exportCurricula(): string {
    const curricula = this.loadCurricula();
    return JSON.stringify(curricula, null, 2);
  }

  /**
   * Import curricula from JSON (for restore)
   */
  static importCurricula(jsonData: string): boolean {
    try {
      const curricula = JSON.parse(jsonData);

      // Validate the structure
      if (!Array.isArray(curricula)) {
        throw new Error("Invalid data format: expected array");
      }

      // Basic validation of curriculum structure
      for (const curriculum of curricula) {
        if (!curriculum.id || !curriculum.name || !Array.isArray(curriculum.flashcards)) {
          throw new Error("Invalid curriculum structure");
        }
      }

      // Convert date strings back to Date objects and save
      const processedCurricula = curricula.map((curriculum: any) => ({
        ...curriculum,
        createdAt: new Date(curriculum.createdAt),
        updatedAt: new Date(curriculum.updatedAt),
      }));

      this.saveCurricula(processedCurricula);
      return true;
    } catch (error) {
      console.error("Error importing curricula:", error);
      return false;
    }
  }
}