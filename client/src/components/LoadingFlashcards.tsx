import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface LoadingFlashcardsProps {
  words: string[];
  currentWord?: string;
}

export default function LoadingFlashcards({ words, currentWord }: LoadingFlashcardsProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-chart-3/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8 max-w-md"
      >
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Sparkles className="h-20 w-20 mx-auto text-primary" />
        </motion.div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            Creating Your Flashcards
          </h2>
          <p className="text-lg text-muted-foreground">
            Finding the perfect images for {words.length} word{words.length !== 1 ? 's' : ''}...
          </p>
          
          {currentWord && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <p className="text-xl text-primary font-semibold">
                {currentWord}
              </p>
            </motion.div>
          )}
        </div>

        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-3 w-3 bg-primary rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
