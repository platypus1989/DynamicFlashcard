# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dynamic Flashcard is an educational web application for preschoolers to learn words through interactive, image-based flashcards. It features a dual-mode design: a playful child-friendly flashcard experience and a clean administrative interface for creating custom curricula.

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite, Wouter routing, TanStack Query, shadcn/ui components, Tailwind CSS, Framer Motion
- **Backend**: Node.js + Express + TypeScript, Drizzle ORM (PostgreSQL configured, currently in-memory storage)
- **External APIs**: Unsplash API for image fetching with LRU caching

## Development Commands

```bash
npm run dev      # Start development server (port 8000)
npm run build    # Build for production (Vite + esbuild)
npm run start    # Start production server
npm run check    # TypeScript type checking
npm run db:push  # Push database schema changes (Drizzle)
```

## Important Development Notes

**Network Permissions**: This codebase was originally built for Replit and has been refactored for standard Node.js environments. If you encounter `EPERM` or `ENOTSUP` errors when starting the development server, this indicates system-level network binding restrictions. Try:
- Setting a custom port: `PORT=9000 npm run dev`
- Using a different host: `HOST=0.0.0.0 npm run dev`
- Running with elevated permissions if necessary for your environment

**ESM Configuration**: The project uses ES modules with TypeScript. Development uses `node --import tsx/esm` for TypeScript compilation. All imports use explicit `.js` extensions for ESM compatibility.

## Architecture

### Directory Structure
- `client/src/` - React frontend with components, pages, and utilities
- `server/` - Express.js backend with API routes and integrations
- `shared/` - Shared TypeScript types and Zod validation schemas
- `design_guidelines.md` - Comprehensive dual-mode design system documentation

### Key Architecture Patterns

**Frontend**: Single-page app with minimal routing. State managed via React useState (local) and TanStack Query (server state). Session-based curriculum storage with no persistence.

**Backend**: RESTful API with primary endpoint `POST /api/flashcards/generate`. Uses abstract storage interface (`IStorage`) allowing easy migration from in-memory to persistent storage.

**Request Flow**: Client → Zod validation → concurrency-controlled Unsplash API calls (5 parallel max) → cached responses → generated flashcard data

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

## Key Features

- **Persistent Local Storage**: All curricula are automatically saved to the user's browser localStorage
- **Full CRUD Operations**: Create, Read, Update, and Delete curricula with complete data persistence
- **Multiple Images per Word**: Each word now stores up to 10 images for better learning generalization
- **Dual Learning Modes**:
  - **Learning Mode**: Sequential display of 3 images per word for structured learning
  - **Test Mode**: Random word/image combinations for knowledge testing
- **Edit Curriculum**: Modify curriculum names and add/remove words with automatic image fetching
- **Multiple curricula support** with custom naming and automatic word deduplication (case-insensitive)
- **Full-screen flashcard experience** with keyboard (arrow keys, spacebar) and touch navigation
- **Automatic fallback** to placeholder images on API errors
- **Progress tracking** with visual completion celebration in learning mode
- **Export/Import functionality** for curriculum backup and restore

## Learning Modes

**Learning Mode:**
- Shows 3 images per word in sequence to help children understand word variations
- Linear progression through all words in the curriculum
- Progress tracking with completion celebration
- Keyboard navigation: Arrow keys, spacebar, Escape to exit

**Test Mode:**
- Random selection of words and images from the curriculum
- Self-assessment with "I knew it" / "I didn't know" tracking
- Accuracy statistics and session history
- Unlimited practice with restart functionality

## Multiple Images Implementation

The application now fetches up to 10 images per word from Unsplash:
- **Server-side**: `searchUnsplashImages()` function fetches multiple images with caching
- **Data Schema**: Extended `Flashcard` interface with `imageUrls?: string[]` while maintaining backward compatibility
- **Learning Mode**: Uses first 3 images per word for sequential viewing
- **Test Mode**: Randomly selects from all available images per word
- **Preview Cards**: Display first image with fallback for existing curricula

## Cache Management

**Automatic Cache Clearing:**
- When a curriculum is deleted, its word images are automatically cleared from server cache
- This ensures that recreating a curriculum with the same words fetches fresh multiple images
- Prevents old single-image cache entries from interfering with new multi-image requests

**Cache API Endpoints:**
- `POST /api/cache/clear-words` - Clear cache for specific words
- `POST /api/cache/clear-all` - Clear all image cache
- `GET /api/cache/stats` - Get cache statistics

**Client-side Cache Management:**
- `CurriculumStorage.clearAllCache()` - Clear all server-side image cache
- Automatic cache clearing integrated with curriculum deletion

## Local Storage Implementation

The application uses browser localStorage to persist curriculum data:

- **Storage Key**: `dynamic-flashcard-curricula`
- **Data Structure**: Array of Curriculum objects with id, name, flashcards, createdAt, updatedAt
- **Automatic Loading**: Curricula are loaded on app startup
- **Real-time Persistence**: All changes (create, edit, delete) are immediately saved
- **Error Handling**: Graceful fallback if localStorage is unavailable or full

## Curriculum Management

**Creating Curricula:**
- Enter words and curriculum name
- Automatic image fetching from Unsplash API
- Duplicate word detection and removal
- Persistent storage in localStorage

**Editing Curricula:**
- Click edit button (⋯ menu) on any curriculum card
- Modify curriculum name
- Add new words (fetches new images automatically)
- Remove existing words
- Changes are saved to localStorage

**Deleting Curricula:**
- Click delete option from curriculum menu
- Confirmation dialog prevents accidental deletion
- Removes from localStorage permanently

## Architecture Components

**Local Storage Layer** (`client/src/lib/curriculumStorage.ts`):
- `CurriculumStorage` class with static methods for all CRUD operations
- Handles data serialization/deserialization with Date objects
- Provides methods for adding/removing words with API integration
- Export/import functionality for data backup

**UI Components**:
- `EditCurriculumDialog`: Modal for editing curriculum name and words
- `CurriculumCard`: Enhanced with edit/delete dropdown menu
- `AlertDialog`: Confirmation dialog for deletion

## Design System

Dual-mode design documented in `design_guidelines.md`:
- **Child-facing**: Bright colors, Quicksand font, large touch targets, playful animations
- **Admin interface**: Professional styling, Inter/Plus Jakarta Sans fonts, clean layouts

## Environment Variables

- `UNSPLASH_ACCESS_KEY` - Required for image fetching (falls back to placeholders if missing)
- `DATABASE_URL` - PostgreSQL connection (configured but not actively used)
- `PORT` - Server port (defaults to 8000)
- `HOST` - Server host (defaults to automatic binding)

## Replit Compatibility

The application maintains backward compatibility with Replit environments:
- Replit-specific plugins are conditionally loaded only when `REPL_ID` environment variable is present
- Server configuration adapts to different deployment environments
- Build process works in both local and Replit environments