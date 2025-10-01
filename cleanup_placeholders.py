#!/usr/bin/env python3
"""
Cleanup script to remove placeholder URLs from curriculum JSON files.
Placeholder URLs (via.placeholder.com) should never be stored.
"""
import json
import os
from pathlib import Path

def is_placeholder_url(url: str) -> bool:
    """Check if URL is a placeholder"""
    return 'via.placeholder.com' in url or 'placeholder' in url.lower()

def clean_flashcard(flashcard: dict) -> dict:
    """Remove placeholder URLs from a flashcard"""
    cleaned = flashcard.copy()
    
    # Clean imageUrls array
    if 'imageUrls' in cleaned and isinstance(cleaned['imageUrls'], list):
        cleaned['imageUrls'] = [
            url for url in cleaned['imageUrls']
            if not is_placeholder_url(url)
        ]
    
    # Clean imageUrl (single)
    if 'imageUrl' in cleaned and is_placeholder_url(cleaned['imageUrl']):
        # If we have imageUrls, use the first one
        if cleaned.get('imageUrls') and len(cleaned['imageUrls']) > 0:
            cleaned['imageUrl'] = cleaned['imageUrls'][0]
        else:
            # No valid images - remove the placeholder
            # Frontend will handle missing images
            cleaned['imageUrl'] = ''
    
    return cleaned

def clean_curriculum_file(filepath: Path) -> dict:
    """Clean a curriculum JSON file"""
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    original_count = 0
    cleaned_count = 0
    
    if 'flashcards' in data and isinstance(data['flashcards'], list):
        for i, flashcard in enumerate(data['flashcards']):
            # Count original placeholders
            if 'imageUrls' in flashcard:
                original_count += sum(1 for url in flashcard['imageUrls'] if is_placeholder_url(url))
            if 'imageUrl' in flashcard and is_placeholder_url(flashcard['imageUrl']):
                original_count += 1
            
            # Clean the flashcard
            data['flashcards'][i] = clean_flashcard(flashcard)
        
        # Count remaining placeholders (should be 0)
        for flashcard in data['flashcards']:
            if 'imageUrls' in flashcard:
                cleaned_count += sum(1 for url in flashcard['imageUrls'] if is_placeholder_url(url))
            if 'imageUrl' in flashcard and is_placeholder_url(flashcard['imageUrl']):
                cleaned_count += 1
    
    return {
        'data': data,
        'removed': original_count - cleaned_count
    }

def main():
    curricula_dir = Path('curricula_data')
    
    if not curricula_dir.exists():
        print("No curricula_data directory found.")
        return
    
    json_files = list(curricula_dir.glob('week_*.json'))
    
    if not json_files:
        print("No curriculum files found.")
        return
    
    print("="*60)
    print("Placeholder Cleanup Tool")
    print("="*60)
    print(f"Found {len(json_files)} curriculum files\n")
    
    total_removed = 0
    files_modified = 0
    
    for filepath in sorted(json_files):
        print(f"Processing {filepath.name}...")
        
        try:
            result = clean_curriculum_file(filepath)
            
            if result['removed'] > 0:
                # Write cleaned data back
                with open(filepath, 'w') as f:
                    json.dump(result['data'], f, indent=2)
                
                print(f"  ✓ Removed {result['removed']} placeholder URLs")
                total_removed += result['removed']
                files_modified += 1
            else:
                print(f"  ✓ No placeholders found")
        
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Files processed: {len(json_files)}")
    print(f"Files modified: {files_modified}")
    print(f"Total placeholders removed: {total_removed}")
    print("="*60)
    
    if total_removed > 0:
        print("\n✓ Cleanup complete!")
        print("  Re-import the cleaned files to update localStorage")
    else:
        print("\n✓ All files are clean - no placeholders found")

if __name__ == "__main__":
    main()

