import LoadingFlashcards from '../LoadingFlashcards';

export default function LoadingFlashcardsExample() {
  return (
    <LoadingFlashcards
      words={["apple", "dog", "sun", "tree"]}
      currentWord="apple"
    />
  );
}
