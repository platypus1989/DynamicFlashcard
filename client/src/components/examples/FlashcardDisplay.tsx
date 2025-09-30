import FlashcardDisplay from '../FlashcardDisplay';

export default function FlashcardDisplayExample() {
  const sampleFlashcards = [
    {
      word: "apple",
      imageUrl: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&h=600&fit=crop"
    },
    {
      word: "dog",
      imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop"
    },
    {
      word: "sun",
      imageUrl: "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=800&h=600&fit=crop"
    }
  ];

  return (
    <FlashcardDisplay
      flashcards={sampleFlashcards}
      onExit={() => console.log("Exit flashcard view")}
    />
  );
}
