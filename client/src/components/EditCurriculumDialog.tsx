import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Loader2 } from "lucide-react";
import type { Curriculum } from "@shared/schema";
import { parseWordInput, findNewWords, deduplicateWords } from "@/lib/wordUtils";

interface EditCurriculumDialogProps {
  curriculum: Curriculum | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { name?: string; words?: string[] }) => Promise<void>;
}

export default function EditCurriculumDialog({
  curriculum,
  isOpen,
  onClose,
  onSave,
}: EditCurriculumDialogProps) {
  const [name, setName] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [newWordsInput, setNewWordsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (curriculum) {
      setName(curriculum.name);
      setWords(curriculum.flashcards.map(fc => fc.word));
    }
  }, [curriculum]);

  const handleAddWords = () => {
    if (!newWordsInput.trim()) return;

    // Parse the input and find truly new words
    const parsedWords = parseWordInput(newWordsInput);
    const uniqueNewWords = findNewWords(parsedWords, words);

    if (uniqueNewWords.length > 0) {
      setWords([...words, ...uniqueNewWords]);
      setNewWordsInput("");
    }
  };

  const handleRemoveWord = (indexToRemove: number) => {
    setWords(words.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async () => {
    if (!curriculum) return;

    setIsSaving(true);
    try {
      const updates: { name?: string; words?: string[] } = {};

      if (name.trim() !== curriculum.name) {
        updates.name = name.trim();
      }

      const currentWords = curriculum.flashcards.map(fc => fc.word);
      const hasWordChanges = words.length !== currentWords.length ||
        words.some(word => !currentWords.some(cw => cw.toLowerCase() === word.toLowerCase()));

      if (hasWordChanges) {
        updates.words = words;
      }

      if (Object.keys(updates).length > 0) {
        await onSave(curriculum.id, updates);
      }

      onClose();
    } catch (error) {
      console.error("Error saving curriculum:", error);
      alert("Failed to save curriculum. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAddWords();
    }
  };

  if (!curriculum) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Curriculum</DialogTitle>
          <DialogDescription>
            Modify the curriculum name and manage words. Add or remove words to customize your learning content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Curriculum Name */}
          <div className="space-y-2">
            <Label htmlFor="curriculum-name">Curriculum Name</Label>
            <Input
              id="curriculum-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter curriculum name"
              maxLength={100}
            />
          </div>

          {/* Current Words */}
          <div className="space-y-3">
            <Label>Current Words ({words.length})</Label>
            <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-muted/30">
              {words.length === 0 ? (
                <p className="text-muted-foreground text-sm">No words yet. Add some words below.</p>
              ) : (
                words.map((word, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {word}
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(index)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${word}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add New Words */}
          <div className="space-y-3">
            <Label htmlFor="new-words">Add New Words</Label>
            <div className="space-y-2">
              <Textarea
                id="new-words"
                value={newWordsInput}
                onChange={(e) => setNewWordsInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter words separated by commas or new lines..."
                className="min-h-[80px]"
                rows={3}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Press Ctrl/Cmd + Enter to add words quickly
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddWords}
                  disabled={!newWordsInput.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Words
                </Button>
              </div>
            </div>
          </div>

          {/* Word Count Validation */}
          {words.length > 50 && (
            <div className="text-sm text-destructive">
              ⚠️ Maximum 50 words allowed. Currently: {words.length}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || words.length === 0 || words.length > 50 || !name.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}