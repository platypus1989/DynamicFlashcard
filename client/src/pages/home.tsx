import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sparkles, BookOpen } from "lucide-react";
import WordInputCard from "@/components/WordInputCard";
import CurriculumCard from "@/components/CurriculumCard";
import EditCurriculumDialog from "@/components/EditCurriculumDialog";
import LoadingFlashcards from "@/components/LoadingFlashcards";
import LearningModeDisplay from "@/components/LearningModeDisplay";
import TestModeDisplay from "@/components/TestModeDisplay";
import { CurriculumStorage } from "@/lib/curriculumStorage";
import type { Curriculum, LearningMode } from "@shared/schema";

export default function Home() {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingWord, setCurrentGeneratingWord] = useState<string>("");
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [selectedMode, setSelectedMode] = useState<LearningMode | null>(null);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [curriculumToDelete, setCurriculumToDelete] = useState<Curriculum | null>(null);

  // Load curricula from localStorage on component mount
  useEffect(() => {
    const loadedCurricula = CurriculumStorage.loadCurricula();
    setCurricula(loadedCurricula);
  }, []);

  const handleGenerateFlashcards = async (words: string[], curriculumName: string) => {
    setIsGenerating(true);
    setCurrentGeneratingWord(words[0]);

    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ words, curriculumName }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const data = await response.json();

      // Use CurriculumStorage to create and persist the curriculum
      const newCurriculum = CurriculumStorage.addCurriculum({
        name: curriculumName,
        flashcards: data.flashcards,
      });

      // Update the state with the new curriculum
      setCurricula([newCurriculum, ...curricula]);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingWord("");
    }
  };

  const handleEditCurriculum = async (id: string, updates: { name?: string; words?: string[] }) => {
    try {
      let updatedCurriculum: Curriculum | null = null;

      if (updates.name) {
        // Update curriculum name
        updatedCurriculum = CurriculumStorage.updateCurriculum(id, { name: updates.name });
      }

      if (updates.words) {
        const curriculum = CurriculumStorage.getCurriculum(id);
        if (!curriculum) {
          throw new Error("Curriculum not found");
        }

        const currentWords = curriculum.flashcards.map(fc => fc.word);
        const newWords = updates.words.filter(word =>
          !currentWords.some(cw => cw.toLowerCase() === word.toLowerCase())
        );
        const wordsToRemove = currentWords.filter(word =>
          !updates.words!.some(w => w.toLowerCase() === word.toLowerCase())
        );

        // Remove words first
        if (wordsToRemove.length > 0) {
          updatedCurriculum = CurriculumStorage.removeWordsFromCurriculum(id, wordsToRemove);
        }

        // Add new words
        if (newWords.length > 0) {
          updatedCurriculum = await CurriculumStorage.addWordsToCurriculum(id, newWords);
        }
      }

      if (updatedCurriculum) {
        // Update the state
        setCurricula(prev => prev.map(c => c.id === id ? updatedCurriculum! : c));
      }

      setEditingCurriculum(null);
    } catch (error) {
      console.error("Error updating curriculum:", error);
      throw error; // Re-throw so the dialog can handle it
    }
  };

  const handleDeleteCurriculum = (curriculum: Curriculum) => {
    setCurriculumToDelete(curriculum);
  };

  const confirmDeleteCurriculum = async () => {
    if (!curriculumToDelete) return;

    try {
      const success = await CurriculumStorage.deleteCurriculum(curriculumToDelete.id);
      if (success) {
        setCurricula(prev => prev.filter(c => c.id !== curriculumToDelete.id));

        // If the deleted curriculum was selected, clear selection
        if (selectedCurriculum?.id === curriculumToDelete.id) {
          setSelectedCurriculum(null);
          setSelectedMode(null);
        }

        console.log(`Successfully deleted curriculum "${curriculumToDelete.name}" and cleared its cache`);
      }
    } catch (error) {
      console.error("Error deleting curriculum:", error);
      alert("Failed to delete curriculum. Please try again.");
    }

    setCurriculumToDelete(null);
  };

  const handlePlayCurriculum = (curriculum: Curriculum, mode: LearningMode) => {
    setSelectedCurriculum(curriculum);
    setSelectedMode(mode);
  };

  const handleExitSession = () => {
    setSelectedCurriculum(null);
    setSelectedMode(null);
  };

  // Show learning mode
  if (selectedCurriculum && selectedMode === "learning") {
    return (
      <LearningModeDisplay
        curriculum={selectedCurriculum}
        onExit={handleExitSession}
      />
    );
  }

  // Show test mode
  if (selectedCurriculum && selectedMode === "test") {
    return (
      <TestModeDisplay
        curriculum={selectedCurriculum}
        onExit={handleExitSession}
      />
    );
  }

  // Don't show legacy display if we're in mode selection
  // Only show it if explicitly needed (shouldn't happen in normal flow)

  if (isGenerating) {
    return (
      <LoadingFlashcards
        words={[currentGeneratingWord]}
        currentWord={currentGeneratingWord}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: 'Quicksand, sans-serif' }}
                    data-testid="text-app-title"
                  >
                    Dynamic Flashcard
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Learning made fun and visual
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="space-y-12">
            {/* Word Input Section */}
            <section className="flex justify-center">
              <WordInputCard onGenerateFlashcards={handleGenerateFlashcards} />
            </section>

            {/* Curricula Grid */}
            {curricula.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Your Curricula</h2>
                  <span className="text-muted-foreground">({curricula.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {curricula.map((curriculum) => (
                    <CurriculumCard
                      key={curriculum.id}
                      curriculum={curriculum}
                      onPlay={(mode) => handlePlayCurriculum(curriculum, mode)}
                      onEdit={() => setEditingCurriculum(curriculum)}
                      onDelete={() => handleDeleteCurriculum(curriculum)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {curricula.length === 0 && (
              <section className="text-center py-16 space-y-4">
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-muted-foreground">
                    No curricula yet
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Create your first curriculum by entering words above.
                    We'll find beautiful images to help your child learn!
                  </p>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Edit Curriculum Dialog */}
      <EditCurriculumDialog
        curriculum={editingCurriculum}
        isOpen={!!editingCurriculum}
        onClose={() => setEditingCurriculum(null)}
        onSave={handleEditCurriculum}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!curriculumToDelete} onOpenChange={() => setCurriculumToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Curriculum</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{curriculumToDelete?.name}"?
              This action cannot be undone and will permanently remove all {curriculumToDelete?.flashcards.length} flashcards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCurriculum} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
