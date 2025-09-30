import WordInputCard from '../WordInputCard';

export default function WordInputCardExample() {
  return (
    <div className="p-8 flex justify-center">
      <WordInputCard
        onGenerateFlashcards={(words, name) => console.log("Generate flashcards for:", words, "with name:", name)}
      />
    </div>
  );
}
