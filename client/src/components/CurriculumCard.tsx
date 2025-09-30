import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2 } from "lucide-react";
import type { Flashcard } from "./FlashcardDisplay";

interface CurriculumCardProps {
  curriculum: {
    id: string;
    name: string;
    flashcards: Flashcard[];
    createdAt: Date;
  };
  onPlay: () => void;
  onDelete: () => void;
}

export default function CurriculumCard({ curriculum, onPlay, onDelete }: CurriculumCardProps) {
  const previewCards = curriculum.flashcards.slice(0, 3);

  return (
    <Card className="overflow-hidden hover-elevate">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{curriculum.name}</CardTitle>
          <Badge variant="secondary" data-testid={`badge-count-${curriculum.id}`}>
            {curriculum.flashcards.length} words
          </Badge>
        </div>
        <CardDescription>
          Created {curriculum.createdAt.toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview Images */}
        <div className="grid grid-cols-3 gap-2">
          {previewCards.map((card, idx) => (
            <div
              key={idx}
              data-testid={`preview-${curriculum.id}-${idx}`}
              className="relative aspect-square rounded-md overflow-hidden bg-muted"
            >
              <img
                src={card.imageUrl}
                alt={card.word}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs text-white font-semibold text-center">
                  {card.word}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            data-testid={`button-play-${curriculum.id}`}
            onClick={onPlay}
            className="flex-1 rounded-full"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Learning
          </Button>
          <Button
            data-testid={`button-delete-${curriculum.id}`}
            onClick={onDelete}
            variant="ghost"
            size="icon"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
