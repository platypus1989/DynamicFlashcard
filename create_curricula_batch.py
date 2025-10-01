#!/usr/bin/env python3
"""
Batch script to create curricula with rate limit management.
Run this script multiple times - it will resume from where it left off.

Usage:
  python create_curricula_batch.py           # Create next batch (default: 3 weeks)
  python create_curricula_batch.py --all     # Try to create all remaining
  python create_curricula_batch.py --batch 5 # Create next 5 weeks
  python create_curricula_batch.py --reset   # Reset and start over
"""
import json
import random
import requests
import re
import sys
import os
from pathlib import Path
from datetime import datetime

PROGRESS_FILE = "curricula_progress.json"
OUTPUT_DIR = "curricula_data"

def load_words():
    """Load and clean words from words.txt"""
    with open('words.txt', 'r') as f:
        lines = f.readlines()
    
    words = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Remove parenthetical notes and asterisks
        cleaned = re.sub(r'\([^)]*\)', '', line).strip()
        cleaned = cleaned.replace('*', '')
        
        if cleaned:
            words.append(cleaned)
    
    return words

def create_word_groups(words, num_groups=10, seed=42):
    """Divide words into groups with consistent randomization"""
    # Use a fixed seed for reproducibility
    random.seed(seed)
    shuffled = words.copy()
    random.shuffle(shuffled)
    
    group_size = len(shuffled) // num_groups
    remainder = len(shuffled) % num_groups
    
    groups = []
    start_idx = 0
    
    for i in range(num_groups):
        size = group_size + (1 if i < remainder else 0)
        end_idx = start_idx + size
        groups.append(shuffled[start_idx:end_idx])
        start_idx = end_idx
    
    return groups

def load_progress():
    """Load progress from file"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {
        "completed_weeks": [],
        "failed_weeks": [],
        "last_run": None
    }

def save_progress(progress):
    """Save progress to file"""
    progress["last_run"] = datetime.now().isoformat()
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def save_curriculum_data(week_num, data):
    """Save curriculum data to JSON file"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filename = f"{OUTPUT_DIR}/week_{week_num:02d}.json"
    
    curriculum_data = {
        "name": f"Week {week_num}",
        "flashcards": data["flashcards"],
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    
    with open(filename, 'w') as f:
        json.dump(curriculum_data, f, indent=2)
    
    return filename

def create_curriculum(week_num, words, base_url="http://localhost:8000"):
    """Create a single curriculum via API"""
    curriculum_name = f"Week {week_num}"
    
    try:
        response = requests.post(
            f"{base_url}/api/flashcards/generate",
            json={
                "words": words,
                "curriculumName": curriculum_name
            },
            timeout=300
        )
        
        if response.status_code == 200:
            data = response.json()
            filename = save_curriculum_data(week_num, data)
            return True, filename, None
        elif response.status_code == 429:
            return False, None, "Rate limit exceeded"
        else:
            return False, None, f"HTTP {response.status_code}: {response.text[:100]}"
    
    except Exception as e:
        return False, None, str(e)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Create curricula in batches')
    parser.add_argument('--batch', type=int, default=3, help='Number of weeks to create (default: 3)')
    parser.add_argument('--all', action='store_true', help='Try to create all remaining weeks')
    parser.add_argument('--reset', action='store_true', help='Reset progress and start over')
    parser.add_argument('--status', action='store_true', help='Show current status')
    args = parser.parse_args()
    
    # Handle reset
    if args.reset:
        if os.path.exists(PROGRESS_FILE):
            os.remove(PROGRESS_FILE)
            print("✓ Progress reset")
        return
    
    # Load words and create groups
    words = load_words()
    groups = create_word_groups(words)
    
    # Load progress
    progress = load_progress()
    
    # Handle status
    if args.status:
        print(f"Total weeks: 10")
        print(f"Completed: {len(progress['completed_weeks'])}")
        print(f"Failed: {len(progress['failed_weeks'])}")
        print(f"Remaining: {10 - len(progress['completed_weeks'])}")
        if progress['completed_weeks']:
            print(f"\nCompleted weeks: {sorted(progress['completed_weeks'])}")
        if progress['failed_weeks']:
            print(f"Failed weeks: {sorted(progress['failed_weeks'])}")
        return
    
    print("="*60)
    print(f"Curriculum Batch Creator")
    print("="*60)
    print(f"Total words: {len(words)}")
    print(f"Total groups: 10")
    print(f"Already completed: {len(progress['completed_weeks'])} weeks")
    print(f"Previously failed: {len(progress['failed_weeks'])} weeks")
    print("="*60)
    
    # Determine which weeks to process
    completed = set(progress['completed_weeks'])
    failed = set(progress['failed_weeks'])
    remaining = [i+1 for i in range(10) if (i+1) not in completed]
    
    if not remaining:
        print("\n✓ All 10 weeks have been completed!")
        print(f"\nGenerated curricula are saved in '{OUTPUT_DIR}/' directory")
        print("Next step: Import them using the frontend import feature")
        return
    
    # Determine batch size
    if args.all:
        batch_size = len(remaining)
    else:
        batch_size = min(args.batch, len(remaining))
    
    weeks_to_create = remaining[:batch_size]
    
    print(f"\nThis run will attempt to create {batch_size} weeks: {weeks_to_create}")
    print(f"Remaining after this: {len(remaining) - batch_size} weeks")
    print("\n" + "="*60)
    
    # Create curricula
    success_count = 0
    rate_limited = False
    
    for week_num in weeks_to_create:
        group = groups[week_num - 1]
        
        print(f"\nWeek {week_num}: {len(group)} words")
        print(f"  Words: {', '.join(group[:5])}{'...' if len(group) > 5 else ''}")
        
        success, filename, error = create_curriculum(week_num, group)
        
        if success:
            print(f"  ✓ Created and saved to {filename}")
            progress['completed_weeks'].append(week_num)
            if week_num in progress['failed_weeks']:
                progress['failed_weeks'].remove(week_num)
            success_count += 1
        else:
            print(f"  ✗ Failed: {error}")
            if week_num not in progress['failed_weeks']:
                progress['failed_weeks'].append(week_num)
            
            if "Rate limit" in str(error) or "429" in str(error):
                rate_limited = True
                print(f"\n⚠️  Rate limit reached. Stopping batch.")
                print(f"   Successfully created {success_count} weeks before hitting limit.")
                break
        
        save_progress(progress)
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Successfully created: {success_count} weeks")
    print(f"Total completed: {len(progress['completed_weeks'])}/10 weeks")
    print(f"Failed: {len(progress['failed_weeks'])} weeks")
    
    if rate_limited:
        print(f"\n⚠️  Hit Unsplash rate limit (50 requests/hour)")
        print(f"   Wait an hour and run the script again to continue.")
    
    if len(progress['completed_weeks']) < 10:
        remaining_count = 10 - len(progress['completed_weeks'])
        print(f"\n📝 To continue: Run this script again to create the remaining {remaining_count} weeks")
        print(f"   Command: python {sys.argv[0]}")
    else:
        print(f"\n✓ All curricula generated!")
        print(f"\nNext steps:")
        print(f"  1. Curricula are saved in '{OUTPUT_DIR}/' directory")
        print(f"  2. Use the import feature in the frontend to load them")
    
    print("="*60)

if __name__ == "__main__":
    main()

