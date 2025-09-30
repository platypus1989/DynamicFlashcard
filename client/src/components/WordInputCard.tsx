import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X } from "lucide-react";

interface WordInputCardProps {
  onGenerateFlashcards: (words: string[]) => void;
}

export default function WordInputCard({ onGenerateFlashcards }: WordInputCardProps) {
  const [inputText, setInputText] = useState("");
  const [words, setWords] = useState<string[]>([]);

  const handleAddWords = () => {
    const newWords = inputText
      .split("\n")
      .map(w => w.trim())
      .filter(w => w.length > 0);
    
    if (newWords.length > 0) {
      const uniqueWords = Array.from(new Set([...words, ...newWords]));
      setWords(uniqueWords);
      setInputText("");
      console.log("Added words:", newWords);
    }
  };

  const removeWord = (wordToRemove: string) => {
    setWords(words.filter(w => w !== wordToRemove));
    console.log("Removed word:", wordToRemove);
  };

  const handleGenerate = () => {
    if (words.length > 0) {
      onGenerateFlashcards(words);
      console.log("Generating flashcards for:", words);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="text-2xl">Create Learning Curriculum</CardTitle>
        <CardDescription>
          Enter words you want your child to learn (one per line)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Textarea
            data-testid="input-words"
            placeholder="Enter words here, one per line&#10;Example:&#10;apple&#10;dog&#10;sun&#10;tree"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-32 text-base resize-none"
          />
          <Button
            data-testid="button-add-words"
            onClick={handleAddWords}
            variant="secondary"
            className="w-full"
            disabled={!inputText.trim()}
          >
            Add Words to List
          </Button>
        </div>

        {words.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {words.length} word{words.length !== 1 ? "s" : ""} added
              </p>
              <Button
                data-testid="button-clear-all"
                onClick={() => setWords([])}
                variant="ghost"
                size="sm"
              >
                Clear All
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {words.map((word) => (
                <Badge
                  key={word}
                  data-testid={`badge-word-${word}`}
                  variant="secondary"
                  className="text-base px-3 py-1.5"
                >
                  {word}
                  <button
                    data-testid={`button-remove-${word}`}
                    onClick={() => removeWord(word)}
                    className="ml-2 hover-elevate rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <Button
              data-testid="button-generate-flashcards"
              onClick={handleGenerate}
              className="w-full rounded-full min-h-12 text-lg"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Flashcards
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
