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
import { Sparkles, BookOpen, Upload, Settings } from "lucide-react";
import WordInputCard from "@/components/WordInputCard";
import CurriculumCard from "@/components/CurriculumCard";
import EditCurriculumDialog from "@/components/EditCurriculumDialog";
import ImportCurriculaDialog from "@/components/ImportCurriculaDialog";
import AudioSettingsDialog from "@/components/AudioSettingsDialog";
import LoadingFlashcards from "@/components/LoadingFlashcards";
import LearningModeDisplay from "@/components/LearningModeDisplay";
import TestModeDisplay from "@/components/TestModeDisplay";
import { CurriculumStorage } from "@/lib/curriculumStorage";
import { findNewWords, findWordsToRemove } from "@/lib/wordUtils";
import type { Curriculum, LearningMode } from "@shared/schema";

export default function Home() {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingWord, setCurrentGeneratingWord] = useState<string>("");
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [selectedMode, setSelectedMode] = useState<LearningMode | null>(null);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [curriculumToDelete, setCurriculumToDelete] = useState<Curriculum | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // Load curricula from localStorage on component mount
  useEffect(() => {
    try {
      const loadedCurricula = CurriculumStorage.loadCurricula();
      setCurricula(loadedCurricula);
      console.log('Loaded curricula:', loadedCurricula.length);
    } catch (error) {
      console.error('Error loading curricula:', error);
      // Clear corrupted data and start fresh
      localStorage.removeItem('curricula');
      setCurricula([]);
    }
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
        const errorData = await response.json().catch(() => ({}));
        
        // Check if it's the API key error
        if (errorData.error === "Unsplash API key not configured") {
          alert(
            "⚠️ Unsplash API Key Not Configured\n\n" +
            errorData.message + "\n\n" +
            "Steps to fix:\n" +
            "1. Go to https://unsplash.com/developers and create an app\n" +
            "2. Copy your Access Key\n" +
            "3. Add it to Vercel: Settings → Environment Variables → UNSPLASH_ACCESS_KEY\n" +
            "4. Redeploy your app"
          );
        } else {
          alert("Failed to generate flashcards. " + (errorData.message || "Please try again."));
        }
        return;
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
        
        // Use utility functions for deduplication
        const newWords = findNewWords(updates.words, currentWords);
        const wordsToRemove = findWordsToRemove(currentWords, updates.words);

        // Remove words first
        if (wordsToRemove.length > 0) {
          updatedCurriculum = CurriculumStorage.removeWordsFromCurriculum(id, wordsToRemove);
        }

        // Add new words (will fetch images from Unsplash for each new word)
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

  const handleExportCurriculum = (curriculum: Curriculum) => {
    try {
      const jsonData = CurriculumStorage.exportCurriculum(curriculum.id);
      if (!jsonData) {
        alert("Failed to export curriculum. Curriculum not found.");
        return;
      }

      // Create a sanitized filename from the curriculum name
      const sanitizedName = curriculum.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '');
      const filename = `${sanitizedName}.json`;

      // Create a blob and trigger download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Successfully exported curriculum "${curriculum.name}" as ${filename}`);
    } catch (error) {
      console.error("Error exporting curriculum:", error);
      alert("Failed to export curriculum. Please try again.");
    }
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

  const handleImportComplete = (count: number) => {
    // Reload curricula from storage
    const loadedCurricula = CurriculumStorage.loadCurricula();
    setCurricula(loadedCurricula);
    console.log(`Successfully imported ${count} curricula`);
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
              <div className="flex items-center justify-between w-full">
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowAudioSettings(true)}
                    title="Audio Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowImportDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Import Curricula
                  </Button>
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
                      onExport={() => handleExportCurriculum(curriculum)}
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

      {/* Audio Settings Dialog */}
      <AudioSettingsDialog
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />

      {/* Import Curricula Dialog */}
      <ImportCurriculaDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={handleImportComplete}
      />

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
