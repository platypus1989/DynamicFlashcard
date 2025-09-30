# Dynamic Flashcard - Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from successful educational platforms like Duolingo Kids, Khan Academy Kids, and Montessori-style learning apps, focusing on playful engagement, simplicity, and visual clarity optimized for preschool-aged children.

**Design Principles**:
1. **Child-First Interface**: Large touch targets, simple navigation, immediate visual feedback
2. **Dual-Mode Design**: Playful, colorful flashcard mode for children; clean, efficient admin mode for parents/teachers
3. **Visual Hierarchy**: Images dominate, words support, distractions eliminated
4. **Encouraging Progression**: Visual progress indicators that celebrate learning

---

## Core Design Elements

### A. Color Palette

**Flashcard Mode (Child-Facing)**:
- Primary: 210 95% 55% (Bright blue - friendly, trustworthy)
- Secondary: 45 95% 55% (Sunny yellow - energetic, happy)
- Success/Progress: 140 70% 50% (Fresh green - encouraging)
- Background Light: 0 0% 98% (Soft white)
- Background Dark: 220 20% 18% (Deep navy for dark mode)
- Card Backgrounds: Pure white with subtle shadows

**Admin Mode (Parent/Teacher)**:
- Primary: 220 80% 45% (Professional blue)
- Accent: 160 60% 45% (Teal - productive, calm)
- Text: 220 15% 25% (Dark slate)
- Backgrounds: Clean whites and light grays

### B. Typography

**Flashcard Display**:
- Primary Font: 'Quicksand' or 'Fredoka' (rounded, friendly, highly legible)
- Word Display: 900 weight, 4-6rem size (massive for readability)
- Navigation: 700 weight, 1.5rem size

**Admin Interface**:
- Primary Font: 'Inter' or 'Plus Jakarta Sans' (clean, professional)
- Headings: 700 weight, 2-3rem size
- Body: 400-500 weight, 1rem size

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 (p-2, m-4, gap-6, etc.)

**Grid Structure**:
- Admin sections: 12-column responsive grid
- Flashcard display: Centered single-column with max-w-5xl
- Word input area: max-w-3xl centered layout

### D. Component Library

**Admin/Input Interface**:
1. **Header**: Logo left, "Create Curriculum" CTA right, clean navigation
2. **Word Input Card**: 
   - Large textarea with placeholder "Enter words (one per line)"
   - Batch entry support with visual word count
   - "Generate Flashcards" primary button (large, rounded-full)
   - Recently added words display as colorful tags/chips
3. **Curriculum List View**:
   - Card grid showing mini-previews (image + word pairs)
   - 3-column desktop, 2-column tablet, 1-column mobile
   - Edit/delete controls on hover
   - Launch button to start learning session

**Flashcard Display Mode**:
1. **Card Component**:
   - Full-screen centered card (80vh height max)
   - Large rounded corners (rounded-3xl)
   - Image section: 60% of card height, crisp images with subtle zoom-in transition
   - Word section: 40% of card, massive typography on solid color background
   - Soft shadow elevation (shadow-2xl)
2. **Navigation Controls**:
   - Large arrow buttons on screen edges (80px touch targets)
   - Bottom pagination dots showing position in deck
   - Keyboard navigation support (arrow keys, spacebar)
3. **Progress Bar**:
   - Colorful gradient bar at top (3-4px height)
   - Fills left-to-right with celebratory micro-animation
   - Shows X of Y cards completed
4. **Exit/Home Button**: 
   - Fixed top-left corner
   - Rounded icon button with blur backdrop

**Overlays**:
- Loading states: Playful spinner with encouraging text
- Empty states: Friendly illustrations with "Add your first words!" messaging
- Completion celebration: Confetti animation with "Great job!" message

### E. Animations

**Use Sparingly**:
- Card flip transition when advancing (300ms ease-in-out)
- Progress bar fill animation (200ms)
- Completion confetti (one-time celebration)
- Gentle image zoom on card display (scale 1.0 to 1.02)
- Button press feedback (scale down slightly)

**Avoid**: Excessive bouncing, distracting background animations, auto-playing media

---

## Specific Page Layouts

### Admin Dashboard
- Clean header with app name and user greeting
- Large "Create New Curriculum" card with word input
- Grid of existing curricula below (image thumbnails + word count)
- Each curriculum card shows preview of first 3 flashcards

### Flashcard Learning View
- Immersive full-screen experience
- Navigation arrows: Fixed left/right edges (hidden on mobile, tap left/right instead)
- Card centered with generous whitespace
- Minimal chrome - focus entirely on learning content

---

## Images

**Hero Section**: Not applicable - this is a utility-focused educational tool

**Flashcard Images**: 
- Source: Unsplash API (kid-appropriate search terms)
- Placement: Top 60% of each flashcard card
- Treatment: Crisp, vibrant, high-quality photos with subtle vignette
- Fallback: Colorful placeholder with icon if API fails

**Empty States**:
- Friendly illustration of child with book/flashcards
- Placement: Center of empty curriculum list
- Style: Simple, colorful line art matching brand palette

---

## Accessibility & Dark Mode

- High contrast ratios (WCAG AAA for child content)
- Dark mode: Deep navy background with bright, colorful cards that maintain vibrancy
- Large touch targets (minimum 60px for child users)
- Screen reader support for parent/teacher admin
- Keyboard navigation for all functions

---

## Key Differentiators

1. **Joyful Learning**: Bright colors, encouraging language, celebration moments
2. **Effortless Creation**: Quick word input → instant curriculum generation
3. **Visual Focus**: Images are hero elements, supporting early visual literacy
4. **Progress Pride**: Clear indicators showing advancement and achievement
5. **Dual Audience**: Professional admin tools + child-optimized learning experience