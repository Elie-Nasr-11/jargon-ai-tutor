## Goal
Make the chat scroll feel smooth, and have the code-editor expansion (when the user opens `</>`) reserve real space in the chat column instead of overlapping the conversation the way the small text composer does.

## Problem today
- The composer is `position: fixed` at the viewport bottom, and the scroll area uses a hard-coded `pb-[200px]` to leave room for it.
- When the composer morphs into the code editor (~220 px of Monaco + chrome + toolbar), it grows past that 200 px reserve and visually covers the last few messages.
- Auto-scroll only fires when `msgs.length` changes, so growing the composer doesn't re-pin the latest message to the visible area.
- Scroll jumps are instant; the user wants the whole interaction to feel smooth.

## Changes

### 1. `src/routes/chat.tsx` — dynamic bottom reserve + smooth scroll
- Add a `composerWrapRef` around the fixed Composer container.
- Track `composerHeight` with a `ResizeObserver` on that wrapper.
- Apply `paddingBottom: composerHeight + 24` inline on the scroll area (replace `pb-[200px]`).
- Replace the `useEffect` that only listens to `msgs.length`:
  - Trigger smooth scroll-to-bottom on `msgs.length` changes as today.
  - Also trigger it when `composerHeight` grows AND the user was already near the bottom (within ~80 px), so opening the code editor keeps the latest message in view instead of hiding it.
- Use `scrollRef.current.scrollTo({ top, behavior: "smooth" })`; the existing call already does this, but it'll now be called on composer growth too.

### 2. `src/components/Composer.tsx` — let the column own the height
- The morph animation currently animates the wrapper from old height → new height and then sets `height: auto`. Keep this, but:
  - Use a single `useLayoutEffect` keyed on `mode` AND on `lang` so switching JS/Py inside code mode doesn't desync.
  - On mount of code panel, after Monaco reports ready, force one more height re-measure (Monaco's first paint changes panel height slightly, which currently causes the small jitter).
  - Drop the `onComplete: height = "auto"` race by setting `auto` only after the next animation frame, so the ResizeObserver in `chat.tsx` reads the final size cleanly.
- Bump the morph easing from `power3.inOut` 0.42 s to `power3.out` 0.36 s for a snappier feel that still reads as smooth.

### 3. `src/styles.css` — global scroll smoothness
- Add `scroll-behavior: smooth;` to `.no-scrollbar` (scoped — we don't want it global because it can interfere with anchor jumps elsewhere).

## Out of scope
- No changes to the composer's visual styling, fixed positioning, or the existing fade-removed footer area.
- No changes to message rendering or animations on individual messages.
- No header/menus changes.

## Files touched
- `src/routes/chat.tsx`
- `src/components/Composer.tsx`
- `src/styles.css`
