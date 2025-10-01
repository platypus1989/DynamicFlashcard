import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Zap, Play } from "lucide-react";
import type { Curriculum, LearningMode } from "@shared/schema";

interface ModeSelectionDialogProps {
  curriculum: Curriculum | null;
  isOpen: boolean;
  onClose: () => void;
  onModeSelect: (mode: LearningMode) => void;
}

export default function ModeSelectionDialog({
  curriculum,
  isOpen,
  onClose,
  onModeSelect,
}: ModeSelectionDialogProps) {
  if (!curriculum) return null;

  const totalImages = curriculum.flashcards.reduce(
    (sum, flashcard) => sum + (flashcard.imageUrls?.length || 1),
    0
  );

  const hasMultipleImages = curriculum.flashcards.some(
    flashcard => flashcard.imageUrls && flashcard.imageUrls.length > 1
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Choose Learning Mode
          </DialogTitle>
          <DialogDescription>
            Select how you'd like to practice with "{curriculum.name}"
            ({curriculum.flashcards.length} words, {totalImages} images total)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Learning Mode */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
            onClick={() => onModeSelect("learning")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Learning Mode
              </CardTitle>
              <CardDescription>
                Structured learning with sequential image viewing
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  Shows 3 images per word in sequence
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  One word at a time for focused learning
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  Perfect for building word-image associations
                </div>
              </div>
              <Button className="w-full mt-4" size="sm">
                Start Learning
              </Button>
            </CardContent>
          </Card>

          {/* Test Mode */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
            onClick={() => onModeSelect("test")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-orange-600" />
                Test Mode
              </CardTitle>
              <CardDescription>
                Random practice to test knowledge and memory
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                  Random word and image combinations
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                  {hasMultipleImages ? "Uses all available images" : "Single image per word"}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                  Great for reinforcing learned associations
                </div>
              </div>
              <Button className="w-full mt-4" size="sm" variant="outline">
                Start Test
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}