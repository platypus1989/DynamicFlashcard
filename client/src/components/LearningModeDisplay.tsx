import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, RotateCcw, X, BookOpen, AlertCircle, Volume2 } from "lucide-react";
import { useSpeech } from "@/hooks/use-speech";
import { AudioSettingsStorage } from "@/lib/audioSettings";
import type { Curriculum, LearningModeSession } from "@shared/schema";

interface LearningModeDisplayProps {
  curriculum: Curriculum;
  onExit: () => void;
}

// Helper function to check if flashcard has valid images
function hasValidImages(flashcard: any): boolean {
  const allImages = flashcard?.imageUrls || [flashcard?.imageUrl];
  const validImages = allImages.filter((url: string) => 
    url && 
    url.trim() !== '' && 
    !url.includes('via.placeholder.com')
  );
  return validImages.length > 0;
}

export default function LearningModeDisplay({ curriculum, onExit }: LearningModeDisplayProps) {
  // Filter out flashcards without valid images
  const validFlashcards = curriculum.flashcards.filter(hasValidImages);
  
  // Load audio settings from global storage
  const [audioSettings] = useState(() => AudioSettingsStorage.loadSettings());

  const { speak, isSupported } = useSpeech({
    lang: 'en-US',
    volume: audioSettings.volume,
    rate: audioSettings.rate,
  });
  
  // If no valid flashcards, show error and exit
  if (validFlashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Images Available</h2>
            <p className="text-muted-foreground mb-6">
              This curriculum doesn't have any words with valid images yet.
              Please regenerate the curriculum with valid images.
            </p>
            <Button onClick={onExit}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const [session, setSession] = useState<LearningModeSession>(() => ({
    currentWordIndex: 0,
    currentImageIndex: 0,
    words: validFlashcards.map(fc => fc.word),
    completedWords: new Set(),
  }));

  const currentFlashcard = validFlashcards[session.currentWordIndex];
  
  // Get valid images (we know they exist because we filtered)
  const allImages = currentFlashcard?.imageUrls || [currentFlashcard?.imageUrl];
  const availableImages = allImages.filter(url => 
    url && 
    url.trim() !== '' && 
    !url.includes('via.placeholder.com')
  );
  
  const currentImageUrl = availableImages[session.currentImageIndex];
  const maxImagesPerWord = 3;
  const imagesToShow = Math.min(maxImagesPerWord, availableImages.length);

  const isWordComplete = session.currentImageIndex >= imagesToShow - 1;
  const isLastWord = session.currentWordIndex >= validFlashcards.length - 1;
  const totalProgress = (session.completedWords.size / validFlashcards.length) * 100;

  // Auto-play when word changes
  useEffect(() => {
    if (audioSettings.autoPlay && isSupported && currentFlashcard) {
      const timer = setTimeout(() => {
        speak(currentFlashcard.word, { 
          volume: audioSettings.volume, 
          rate: audioSettings.rate 
        });
      }, 300); // Small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [session.currentWordIndex, audioSettings.autoPlay, audioSettings.volume, audioSettings.rate, isSupported, currentFlashcard, speak]);

  const handlePlayWord = () => {
    if (currentFlashcard) {
      speak(currentFlashcard.word, { 
        volume: audioSettings.volume, 
        rate: audioSettings.rate 
      });
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "Escape") {
        onExit();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [session]);

  const handleNext = () => {
    if (session.currentImageIndex < imagesToShow - 1) {
      // Show next image of current word
      setSession(prev => ({
        ...prev,
        currentImageIndex: prev.currentImageIndex + 1,
      }));
    } else if (!isLastWord) {
      // Move to next word
      const newCompletedWords = new Set(session.completedWords);
      newCompletedWords.add(currentFlashcard.word);

      setSession(prev => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex + 1,
        currentImageIndex: 0,
        completedWords: newCompletedWords,
      }));
    } else {
      // Mark last word as complete and potentially show completion
      const newCompletedWords = new Set(session.completedWords);
      newCompletedWords.add(currentFlashcard.word);

      setSession(prev => ({
        ...prev,
        completedWords: newCompletedWords,
      }));
    }
  };

  const handlePrevious = () => {
    if (session.currentImageIndex > 0) {
      // Show previous image of current word
      setSession(prev => ({
        ...prev,
        currentImageIndex: prev.currentImageIndex - 1,
      }));
    } else if (session.currentWordIndex > 0) {
      // Move to previous word
      const prevFlashcard = validFlashcards[session.currentWordIndex - 1];
      const prevAllImages = prevFlashcard?.imageUrls || [prevFlashcard?.imageUrl];
      const prevAvailableImages = prevAllImages.filter(url => 
        url && 
        url.trim() !== '' && 
        !url.includes('via.placeholder.com')
      );
      const prevImagesToShow = Math.min(maxImagesPerWord, prevAvailableImages.length);

      setSession(prev => {
        const newCompletedWords = new Set(prev.completedWords);
        newCompletedWords.delete(prevFlashcard.word);

        return {
          ...prev,
          currentWordIndex: prev.currentWordIndex - 1,
          currentImageIndex: prevImagesToShow - 1,
          completedWords: newCompletedWords,
        };
      });
    }
  };

  const handleRestart = () => {
    setSession({
      currentWordIndex: 0,
      currentImageIndex: 0,
      words: curriculum.flashcards.map(fc => fc.word),
      completedWords: new Set(),
    });
  };

  // Show completion screen
  if (session.completedWords.size === validFlashcards.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-muted-foreground mb-6">
              You've completed learning all {validFlashcards.length} words in "{curriculum.name}"!
            </p>
            <div className="space-y-3">
              <Button onClick={handleRestart} className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Practice Again
              </Button>
              <Button onClick={onExit} variant="outline" className="w-full">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onExit}>
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold">Learning Mode</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {session.currentWordIndex + 1} of {validFlashcards.length} words
            </Badge>
            <div className="text-sm text-muted-foreground">
              Image {session.currentImageIndex + 1} of {imagesToShow}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/80 backdrop-blur-sm px-4 pb-2">
        <div className="container mx-auto">
          <Progress value={totalProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {session.completedWords.size} of {validFlashcards.length} words completed
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <Card className="overflow-hidden shadow-xl">
            <CardContent className="p-0">
              {/* Image */}
              <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-gray-100 to-gray-200">
                <img
                  src={currentImageUrl}
                  alt={currentFlashcard.word}
                  className="w-full h-full object-cover"
                  loading="eager"
                />

                {/* Image indicator dots */}
                {imagesToShow > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {Array.from({ length: imagesToShow }, (_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === session.currentImageIndex
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Word Display */}
              <div className="p-8 text-center bg-white">
                <div className="flex items-center justify-center gap-4">
                  <h1
                    className="text-4xl md:text-6xl font-bold text-gray-800"
                    style={{ fontFamily: 'Quicksand, sans-serif' }}
                  >
                    {currentFlashcard.word}
                  </h1>
                  {isSupported && (
                    <Button
                      onClick={handlePlayWord}
                      size="icon"
                      variant="ghost"
                      className="rounded-full h-12 w-12"
                      title="Replay pronunciation"
                    >
                      <Volume2 className="h-6 w-6" />
                    </Button>
                  )}
                </div>

                {imagesToShow > 1 && (
                  <p className="text-muted-foreground mt-4">
                    {session.currentImageIndex < imagesToShow - 1
                      ? "See more examples →"
                      : isLastWord
                      ? "Ready for next word!"
                      : "Next word →"
                    }
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur-sm border-t p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={session.currentWordIndex === 0 && session.currentImageIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onExit}>
              Exit
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleNext}
            disabled={isLastWord && isWordComplete}
          >
            {session.currentImageIndex < imagesToShow - 1
              ? "Next Image"
              : isLastWord
              ? "Complete"
              : "Next Word"
            }
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
        Arrow keys or Space: Navigate • R: Restart • Escape or Exit button: Exit learning mode
      </div>
    </div>
  );
}
