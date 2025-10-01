# Batch Curriculum Creation Guide

Due to Unsplash API rate limits (50 requests/hour), creating all curricula at once isn't possible. This guide explains the batch creation workflow.

## The Problem

- Unsplash Demo API limit: **50 requests/hour**
- Each word needs **1 request** to fetch 10 images
- 138 words = 138 requests (far exceeds limit)
- Direct API calls don't save to localStorage (only frontend does)

## The Solution

**Two-step process:**
1. Generate curriculum JSON files using the batch script (respects rate limits)
2. Import JSON files through the frontend UI

---

## Step 1: Generate Curriculum Files

Run the batch script to create curriculum JSON files:

```bash
# Create next 3 weeks (default)
python create_curricula_batch.py

# Create next 5 weeks
python create_curricula_batch.py --batch 5

# Try to create all remaining weeks (will stop at rate limit)
python create_curricula_batch.py --all

# Check status
python create_curricula_batch.py --status

# Reset progress and start over
python create_curricula_batch.py --reset
```

### What Happens

- Script divides 138 words into 10 groups (weeks)
- Creates JSON files in `curricula_data/` folder
- Tracks progress in `curricula_progress.json`
- **Automatically resumes** where it left off on next run
- Stops if rate limit is hit

### Rate Limit Management

If you hit the rate limit:
1. Script will stop and save progress
2. **Wait 1 hour** for Unsplash rate limit to reset
3. Run the script again - it will continue from where it stopped

### Example Workflow

```bash
# First run - creates weeks 1-3
python create_curricula_batch.py
# ✓ Week 1, Week 2, Week 3 created

# Wait 1 hour if rate limited...

# Second run - creates weeks 4-6
python create_curricula_batch.py
# ✓ Week 4, Week 5, Week 6 created

# Continue until all 10 weeks are done
```

---

## Step 2: Import to Frontend

Once you have JSON files in `curricula_data/`:

1. **Open the app** in your browser
2. **Click "Import Curricula"** button (top right)
3. **Select JSON files** from `curricula_data/` folder
   - You can select multiple files at once
   - Or import them one at a time
4. **Curricula appear** on your home page immediately

### Import Features

- ✅ Multiple files at once
- ✅ Skips duplicates (by name)
- ✅ Shows success/error messages
- ✅ Saves directly to localStorage
- ✅ Immediately available for learning/testing

---

## Folder Structure

```
DynamicFlashcard/
├── words.txt                        # Source word list
├── create_curricula_batch.py        # Batch generation script
├── curricula_progress.json          # Progress tracking
├── curricula_data/                  # Generated curriculum files
│   ├── week_01.json
│   ├── week_02.json
│   └── ...
└── BATCH_IMPORT_GUIDE.md            # This guide
```

---

## Troubleshooting

### "Rate limit exceeded"
- **Solution:** Wait 1 hour, then run script again

### "No curricula appearing after import"
- **Cause:** You called the API directly, bypassing the frontend
- **Solution:** Use the Import button in the UI instead

### "Import failed: Invalid format"
- **Cause:** JSON file is corrupted or wrong format
- **Solution:** Regenerate the specific week using the batch script

### Want to start over?
```bash
# Reset progress
python create_curricula_batch.py --reset

# Delete generated files
rm -rf curricula_data/
rm curricula_progress.json
```

---

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `python create_curricula_batch.py` | Create next 3 weeks |
| `python create_curricula_batch.py --batch 5` | Create next 5 weeks |
| `python create_curricula_batch.py --all` | Create all remaining |
| `python create_curricula_batch.py --status` | Show progress |
| `python create_curricula_batch.py --reset` | Start over |

---

## Tips

1. **Run during off-hours** - Spread out over multiple hours/days
2. **Batch size of 3-4** works well to stay under rate limit
3. **Import as you go** - Don't need to wait for all 10 weeks
4. **Each curriculum has ~14 words** with **10 images each**
5. **Progress is saved** - Safe to stop and resume anytime

