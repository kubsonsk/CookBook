# CookBook Project Documentation

## Recent Feature Implementations

### Swipe Actions (April 2026)
- **Home Page Interactivity:** Added iPhone-style swipe actions to `RecipeCard` and `RecipeListItem`.
  - **Swipe Right:** Reveals "Edit" action (Blue). Long swipe or fast flick triggers navigation to the edit form.
  - **Swipe Left:** Reveals "Delete" action (Red). Long swipe or fast flick opens a confirmation modal.
- **Confirmation Modals:** Custom-styled `AnimatePresence` modals for deleting recipes, ensuring accidental deletions are avoided.
- **State Reliability:** Implemented `isMounted` checks in swipe components to prevent state updates on unmounted components during deletion.

### Mobile & PWA Optimization
- **Transition Stability:** Removed `AnimatePresence mode="wait"` from the global layout to prevent "stuck" transitions (blank screens) on mobile devices.
- **Layout Consistency:** 
  - Refactored `App.tsx` layout to use `h-screen` and `overflow-hidden` on the root, with `overflow-y-auto` on the main content area.
  - Fixed "Add" page layout where the navigation bar was being pushed out of view.
  - Reintroduced route transitions by wrapping individual pages in `motion.div`.

### Recipe Management
- **Bulk Import/Export:** Added functionality to import and export recipes via JSON files in the Settings page.
- **Label Management:** Centralized label management page to create and delete labels across the application.
- **Data Cleanup:** Removed the unused `rating` field from the `Recipe` type and related UI components to simplify the data model.

### UI & UX
- **Unified Typography:** Standardized all main page titles (Home, Add, Settings, Label Management) to use a consistent `text-3xl font-black uppercase` style, improving brand cohesion across the app.
- **Scroll-Adaptive Search:**
  - Implemented a Floating Action Button (FAB) for search that appears when the user scrolls down.
  - Sticky search and filter bar that mounts to the top of the viewport when active during scroll, ensuring filtering is always accessible.
  - View switcher remains in the non-sticky header to reduce visual noise during scroll.
- **Header Refactoring:** Adjusted header layouts to accommodate larger typography while maintaining access to secondary actions like search and back navigation.
- **Custom Accent Colors:** Users can now choose from a variety of accent colors (orange, blue, green, rose, purple, amber) which update the primary theme globally.
- **View Modes:** Toggle between 'Card' and 'List' views on the HomePage, with the preference persisted in local storage.
- **Theme Support:** Robust Dark/Light mode support with smooth transitions.

## Project Architecture Notes
- **Framework:** React 19 (TypeScript) + Vite.
- **Styling:** Tailwind CSS 4.
- **Animations:** Framer Motion.
- **Backend:** Firebase (Auth, Firestore).
- **Icons:** Lucide React.

## Maintenance Guidelines
- **Push Approval:** **Mandatory** user approval required before any `git push` operation.
- **Transitions:** Avoid `mode="wait"` in shared layouts; prefer individual page entry animations.
- **Mobile First:** Always verify layout and transitions on mobile/PWA viewport heights.
