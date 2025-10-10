import type { Curriculum, Flashcard } from "@shared/schema";

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
   * Add words to an existing curriculum (will fetch new images)
   */
  static async addWordsToCurriculum(id: string, newWords: string[]): Promise<Curriculum | null> {
    const curriculum = this.getCurriculum(id);
    if (!curriculum) {
      console.warn(`Curriculum with id ${id} not found`);
      return null;
    }

    // Get current words to avoid duplicates
    const currentWords = curriculum.flashcards.map(fc => fc.word.toLowerCase());
    const uniqueNewWords = newWords.filter(word =>
      !currentWords.includes(word.toLowerCase())
    );

    if (uniqueNewWords.length === 0) {
      console.log("No new unique words to add");
      return curriculum;
    }

    try {
      // Fetch flashcards for new words
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

      // Combine existing and new flashcards
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