import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Zap, RotateCcw, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import type { Curriculum, Flashcard } from "@shared/schema";

interface TestModeDisplayProps {
  curriculum: Curriculum;
  onExit: () => void;
}

// Helper function to check if flashcard has valid images
function hasValidImages(flashcard: Flashcard): boolean {
  const allImages = flashcard?.imageUrls || [flashcard?.imageUrl];
  const validImages = allImages.filter(url => 
    url && 
    url.trim() !== '' && 
    !url.includes('via.placeholder.com')
  );
  return validImages.length > 0;
}

function getRandomWordAndImage(validFlashcards: Flashcard[]): { word: string; imageUrl: string } {
  const randomFlashcard = validFlashcards[Math.floor(Math.random() * validFlashcards.length)];
  
  // Get valid images (we know they exist because we filtered)
  const allImages = randomFlashcard.imageUrls || [randomFlashcard.imageUrl];
  const availableImages = allImages.filter(url => 
    url && 
    url.trim() !== '' && 
    !url.includes('via.placeholder.com')
  );
  
  const randomImageUrl = availableImages[Math.floor(Math.random() * availableImages.length)];
  
  return {
    word: randomFlashcard.word,
    imageUrl: randomImageUrl,
  };
}

export default function TestModeDisplay({ curriculum, onExit }: TestModeDisplayProps) {
  // Filter out flashcards without valid images
  const validFlashcards = curriculum.flashcards.filter(hasValidImages);
  
  // If no valid flashcards, show error and exit
  if (validFlashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
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
  
  const [currentCard, setCurrentCard] = useState(() => getRandomWordAndImage(validFlashcards));
  const [cardsSeen, setCardsSeen] = useState(1);
  const [isWordRevealed, setIsWordRevealed] = useState(false);

  const handleNext = () => {
    setCurrentCard(getRandomWordAndImage(validFlashcards));
    setCardsSeen(prev => prev + 1);
    setIsWordRevealed(false);
  };

  const handlePrevious = () => {
    // In test mode, previous also generates a random card
    setCurrentCard(getRandomWordAndImage(validFlashcards));
    setCardsSeen(prev => prev + 1);
    setIsWordRevealed(false);
  };

  const handleRestart = () => {
    setCurrentCard(getRandomWordAndImage(validFlashcards));
    setCardsSeen(1);
    setIsWordRevealed(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "Escape") {
        onExit();
      } else if (e.key === "r" || e.key === "R") {
        handleRestart();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onExit}>
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <span className="font-semibold">Test Mode - Random Practice</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {cardsSeen} cards seen
            </Badge>
            <Badge variant="outline">
              {validFlashcards.length} words available
            </Badge>
          </div>
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
                  src={currentCard.imageUrl}
                  alt={currentCard.word}
                  className="w-full h-full object-cover"
                  loading="eager"
                />

              </div>

              {/* Word Display */}
              <div className="p-8 text-center bg-white">
                {!isWordRevealed ? (
                  <Button
                    onClick={() => setIsWordRevealed(true)}
                    size="lg"
                    className="text-lg px-8 py-6"
                  >
                    Reveal Word
                  </Button>
                ) : (
                  <h1
                    className="text-4xl md:text-6xl font-bold text-gray-800 mb-4"
                    style={{ fontFamily: 'Quicksand, sans-serif' }}
                  >
                    {currentCard.word}
                  </h1>
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
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onExit}>
              Exit
            </Button>
          </div>

          <Button onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
        Arrow keys or Space: Navigate • R: Restart • Escape or Exit button: Exit test mode
      </div>
    </div>
  );
}