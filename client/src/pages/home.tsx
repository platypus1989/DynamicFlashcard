import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen } from "lucide-react";
import WordInputCard from "@/components/WordInputCard";
import CurriculumCard from "@/components/CurriculumCard";
import LoadingFlashcards from "@/components/LoadingFlashcards";
import FlashcardDisplay from "@/components/FlashcardDisplay";
import type { Flashcard } from "@shared/schema";

interface Curriculum {
  id: string;
  name: string;
  flashcards: Flashcard[];
  createdAt: Date;
}

export default function Home() {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingWord, setCurrentGeneratingWord] = useState<string>("");
  const [activeCurriculum, setActiveCurriculum] = useState<Curriculum | null>(null);

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

      const newCurriculum: Curriculum = {
        id: Date.now().toString(),
        name: curriculumName,
        flashcards: data.flashcards,
        createdAt: new Date()
      };

      setCurricula([newCurriculum, ...curricula]);
      setActiveCurriculum(newCurriculum);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingWord("");
    }
  };

  const handleDeleteCurriculum = (id: string) => {
    setCurricula(curricula.filter(c => c.id !== id));
    console.log("Deleted curriculum:", id);
  };

  if (activeCurriculum) {
    return (
      <FlashcardDisplay
        flashcards={activeCurriculum.flashcards}
        onExit={() => setActiveCurriculum(null)}
      />
    );
  }

  if (isGenerating) {
    return (
      <LoadingFlashcards
        words={[currentGeneratingWord]}
        currentWord={currentGeneratingWord}
      />
    );
  }

  return (
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {curricula.map((curriculum) => (
                  <CurriculumCard
                    key={curriculum.id}
                    curriculum={curriculum}
                    onPlay={() => setActiveCurriculum(curriculum)}
                    onDelete={() => handleDeleteCurriculum(curriculum.id)}
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
  );
}
