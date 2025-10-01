import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Home, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Flashcard } from "@shared/schema";

interface FlashcardDisplayProps {
  flashcards: Flashcard[];
  onExit?: () => void;
}

export default function FlashcardDisplay({ flashcards, onExit }: FlashcardDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  const goToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      console.log("Next card:", flashcards[currentIndex + 1].word);
    } else {
      setShowConfetti(true);
      console.log("Completed all flashcards!");
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
      console.log("Previous card:", flashcards[currentIndex - 1].word);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex]);

  if (showConfetti) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center space-y-8"
        >
          <div className="space-y-4">
            <Sparkles className="h-24 w-24 mx-auto text-white" />
            <h1 className="text-6xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>
              Great Job!
            </h1>
            <p className="text-2xl text-white/90">
              You learned {flashcards.length} new word{flashcards.length !== 1 ? 's' : ''}!
            </p>
          </div>
          <Button
            data-testid="button-finish"
            onClick={onExit}
            size="lg"
            variant="secondary"
            className="rounded-full min-h-12 text-xl px-8"
          >
            <Home className="mr-2 h-6 w-6" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="h-1 bg-muted relative">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-accent to-chart-3"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Button
          data-testid="button-exit"
          onClick={onExit}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <Home className="h-5 w-5" />
        </Button>
        <p className="text-sm text-muted-foreground" data-testid="text-progress">
          {currentIndex + 1} of {flashcards.length}
        </p>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="relative w-full max-w-5xl h-full max-h-[80vh] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -100 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <Card
                data-testid={`card-flashcard-${currentIndex}`}
                className="h-full w-full flex flex-col overflow-hidden shadow-2xl"
              >
                {/* Image Section - 60% */}
                <div className="h-[60%] relative bg-muted overflow-hidden">
                  <motion.img
                    src={currentCard.imageUrl && !currentCard.imageUrl.includes('via.placeholder.com') 
                      ? currentCard.imageUrl 
                      : `https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=${encodeURIComponent(currentCard.word)}`
                    }
                    alt={currentCard.word}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Word Section - 40% */}
                <div className="h-[40%] flex items-center justify-center bg-primary p-8">
                  <h1
                    data-testid={`text-word-${currentCard.word}`}
                    className="text-6xl md:text-8xl font-black text-primary-foreground text-center"
                    style={{ fontFamily: 'Quicksand, sans-serif' }}
                  >
                    {currentCard.word}
                  </h1>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows - Desktop */}
          <div className="hidden md:block">
            <Button
              data-testid="button-previous"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              variant="secondary"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-20 h-20 w-20 rounded-full shadow-lg"
            >
              <ChevronLeft className="h-10 w-10" />
            </Button>

            <Button
              data-testid="button-next"
              onClick={goToNext}
              variant="secondary"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-20 h-20 w-20 rounded-full shadow-lg"
            >
              <ChevronRight className="h-10 w-10" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden p-4 flex gap-4">
        <Button
          data-testid="button-previous-mobile"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          variant="secondary"
          className="flex-1 min-h-14 text-lg"
        >
          <ChevronLeft className="mr-2 h-6 w-6" />
          Previous
        </Button>
        <Button
          data-testid="button-next-mobile"
          onClick={goToNext}
          variant="default"
          className="flex-1 min-h-14 text-lg"
        >
          Next
          <ChevronRight className="ml-2 h-6 w-6" />
        </Button>
      </div>

      {/* Pagination Dots */}
      <div className="pb-6 flex justify-center gap-2">
        {flashcards.map((_, idx) => (
          <div
            key={idx}
            data-testid={`dot-${idx}`}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex
                ? "w-8 bg-primary"
                : idx < currentIndex
                ? "w-2 bg-chart-3"
                : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
