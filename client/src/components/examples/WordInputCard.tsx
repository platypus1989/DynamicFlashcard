import WordInputCard from '../WordInputCard';

export default function WordInputCardExample() {
  return (
    <div className="p-8 flex justify-center">
      <WordInputCard
        onGenerateFlashcards={(words) => console.log("Generate flashcards for:", words)}
      />
    </div>
  );
}
