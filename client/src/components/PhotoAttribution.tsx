import type { PhotoAttribution as PhotoAttributionType } from "@shared/schema";

interface PhotoAttributionProps {
  attribution: PhotoAttributionType | null | undefined;
  className?: string;
}

/**
 * Component to display Unsplash photo attribution
 * Shows photographer name and Unsplash attribution with proper links
 */
export default function PhotoAttribution({ attribution, className = "" }: PhotoAttributionProps) {
  // Don't render anything if no attribution data
  if (!attribution) {
    return null;
  }

  const photographerUrl = `https://unsplash.com/@${attribution.photographerUsername}?utm_source=DynamicFlashcard&utm_medium=referral`;
  const unsplashUrl = "https://unsplash.com/?utm_source=DynamicFlashcard&utm_medium=referral";

  return (
    <div 
      className={`absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded ${className}`}
      style={{ fontSize: '10px', lineHeight: '1.2' }}
    >
      Photo by{' '}
      <a
        href={photographerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-gray-200 transition-colors"
      >
        {attribution.photographerName}
      </a>
      {' '}on{' '}
      <a
        href={unsplashUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-gray-200 transition-colors"
      >
        Unsplash
      </a>
    </div>
  );
}

