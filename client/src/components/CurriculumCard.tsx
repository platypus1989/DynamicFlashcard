import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import type { Curriculum, LearningMode } from "@shared/schema";

interface CurriculumCardProps {
  curriculum: Curriculum;
  onPlay: (mode: LearningMode) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CurriculumCard({ curriculum, onPlay, onEdit, onDelete }: CurriculumCardProps) {
  const previewCards = curriculum.flashcards.slice(0, 3);

  return (
    <Card className="overflow-hidden hover-elevate">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{curriculum.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" data-testid={`badge-count-${curriculum.id}`}>
              {curriculum.flashcards.length} words
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription>
          Created {curriculum.createdAt.toLocaleDateString()}
          {curriculum.updatedAt.getTime() !== curriculum.createdAt.getTime() && (
            <span className="text-muted-foreground">
              {" • Updated "}
              {curriculum.updatedAt.toLocaleDateString()}
            </span>
          )}
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
                loading="lazy"
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
            data-testid={`button-learn-${curriculum.id}`}
            onClick={() => onPlay('learning')}
            className="flex-1 rounded-full"
            variant="default"
          >
            Learn
          </Button>
          <Button
            data-testid={`button-test-${curriculum.id}`}
            onClick={() => onPlay('test')}
            className="flex-1 rounded-full"
            variant="outline"
          >
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
