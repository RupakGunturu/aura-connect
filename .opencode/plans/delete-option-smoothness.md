# Plan: Improve Delete Option Smoothness

**File:** `src/components/chat/MessageBubble.jsx`

## Changes to `DeleteOptionsSheet` component (lines 121–205)

### 1. Press feedback
Convert all three `<button>` elements to `<motion.button>` with `whileTap={{ scale: 0.97 }}` for a satisfying press-down feel. Currently they are static with no tactile feedback.

### 2. Smooth hover transitions
Add `transition: "background 0.15s ease"` to each button's inline style, plus `onMouseEnter`/`onMouseLeave` handlers that smoothly shift the background:
- **"Delete for me" / "Cancel":** `rgba(255,255,255,0.05)` → `rgba(255,255,255,0.1)`
- **"Delete for everyone":** `rgba(239,68,68,0.12)` → `rgba(239,68,68,0.2)`

### 3. Remove focus outline
Add `outline: "none"` to each button to prevent ugly focus rectangles after clicking.

## No structural changes
- The two-step flow (ActionBar → DeleteOptionsSheet) stays the same
- ActionBar component is untouched
- All animations (backdrop fade, sheet slide-up) remain unchanged
