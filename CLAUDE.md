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

- Multiple curricula support with custom naming
- Automatic word deduplication (case-insensitive)
- Full-screen flashcard experience with keyboard (arrow keys, spacebar) and touch navigation
- Automatic fallback to placeholder images on API errors
- Progress tracking with visual completion celebration

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