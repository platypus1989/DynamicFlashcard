# Dynamic Flashcard

## Overview

Dynamic Flashcard is an educational web application designed for preschoolers to learn words through interactive, image-based flashcards. The application features a dual-mode design: a playful, child-friendly flashcard viewing experience and a clean administrative interface for parents and teachers to create custom curricula. The system integrates with the Unsplash API to automatically fetch relevant images for each word, creating visually engaging learning materials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **UI Components:** shadcn/ui (Radix UI primitives with custom styling)
- **Styling:** Tailwind CSS with custom design tokens
- **Animations:** Framer Motion for flashcard transitions and loading states
- **Build Tool:** Vite

**Design System:**
- Implements a dual-mode design philosophy with distinct color palettes for child-facing (bright, playful) and admin modes (professional, clean)
- Custom Tailwind configuration with child-friendly fonts (Quicksand) and professional fonts (Plus Jakarta Sans)
- Extensive use of CSS custom properties for theming (light/dark mode support)
- Component library based on shadcn/ui "new-york" style preset

**Key Frontend Components:**
- `FlashcardDisplay`: Full-screen flashcard viewer with keyboard navigation, swipe support, and progress tracking
- `WordInputCard`: Administrative form for creating curricula with custom naming and word input
- `CurriculumCard`: Displays saved curricula with preview images and metadata
- `LoadingFlashcards`: Animated loading state during flashcard generation

**Key Features:**
- Multiple curricula support with custom names (e.g., "Week 1", "Animals", "Transportation")
- Session-based curriculum storage (client-side)
- Full-screen immersive flashcard experience
- Keyboard navigation (arrow keys, spacebar) and touch/click controls
- Progress tracking with visual completion celebration
- Automatic word deduplication

**Rationale:** React with TypeScript provides type safety and component reusability. Vite offers fast development builds. TanStack Query simplifies API state management and caching. The lightweight stack is appropriate for a focused educational tool.

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript (ESM modules)
- **Build Tool:** esbuild for production builds
- **Development:** tsx for hot-reloading during development

**API Design:**
- RESTful API with primary endpoint: `POST /api/flashcards/generate`
- Accepts curriculum name (max 100 chars) and word array (1-50 words, 1-64 chars each)
- Request validation using Zod schemas with automatic trimming and deduplication
- Concurrency control: Fetches images in batches of 5 parallel requests
- LRU caching with 500-item capacity to minimize Unsplash API calls
- 5-second timeout on external API requests

**Storage Strategy:**
- Currently implements in-memory storage (`MemStorage` class) for user data
- Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless`)
- Database schema defined but storage layer uses in-memory implementation
- Design allows easy migration to persistent database storage by swapping the storage implementation

**Rationale:** Express provides a mature, well-understood foundation for the API. In-memory storage simplifies initial development and deployment. The abstracted storage interface (`IStorage`) enables future persistence without changing business logic. Drizzle ORM is configured for when persistent storage is needed.

### External Dependencies

**Unsplash API Integration:**
- **Purpose:** Fetch relevant images for flashcard words
- **Implementation:** Server-side integration in `server/unsplash.ts`
- **Authentication:** Client-ID based (requires `UNSPLASH_ACCESS_KEY` environment variable)
- **Caching:** LRU cache with 500-item capacity, case-insensitive key matching
- **Performance:** 5-second timeout per request, batched processing with concurrency limit of 5
- **Resilience:** Automatic fallback to placeholder images on API errors or missing key
- **Features:** Landscape orientation preference for kid-friendly display
- **Endpoint Used:** `/search/photos`

**Database (Configured, Not Active):**
- **Provider:** Neon (serverless PostgreSQL)
- **ORM:** Drizzle ORM with Drizzle Kit for migrations
- **Configuration:** Connection via `DATABASE_URL` environment variable
- **Schema Location:** `shared/schema.ts`
- **Migration Strategy:** Push-based using `drizzle-kit push`

**UI Component Libraries:**
- **Radix UI:** Comprehensive set of unstyled, accessible component primitives
- **shadcn/ui:** Pre-styled components built on Radix UI
- **Framer Motion:** Animation library for smooth transitions
- **React Hook Form:** Form state management with Zod validation

**Development Tools:**
- **Replit Plugins:** Development banner, cartographer (development environment only)
- **Runtime Error Overlay:** Enhanced error reporting during development

**Font Services:**
- **Google Fonts:** Quicksand (child-facing) and Plus Jakarta Sans (admin interface)

**Rationale for Unsplash:** Provides high-quality, royalty-free images that make flashcards visually appealing. Server-side integration keeps API keys secure. Caching reduces costs and improves performance. The landscape orientation preference ensures images work well in the flashcard display format.