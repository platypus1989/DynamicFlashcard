import CurriculumCard from '../CurriculumCard';

export default function CurriculumCardExample() {
  const sampleCurriculum = {
    id: "1",
    name: "Animals & Nature",
    createdAt: new Date(),
    updatedAt: new Date(),
    flashcards: [
      {
        word: "dog",
        imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop"
      },
      {
        word: "cat",
        imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop"
      },
      {
        word: "tree",
        imageUrl: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=400&h=400&fit=crop"
      }
    ]
  };

  return (
    <div className="p-8 max-w-sm">
      <CurriculumCard
        curriculum={sampleCurriculum}
        onPlay={() => console.log("Play curriculum")}
        onEdit={() => console.log("Edit curriculum")}
        onDelete={() => console.log("Delete curriculum")}
        onExport={() => console.log("Export curriculum")}
      />
    </div>
  );
}
