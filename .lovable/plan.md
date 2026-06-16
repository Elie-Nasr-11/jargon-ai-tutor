## Goal

When the code editor opens, the chat scroll area shrinks so the composer/code panel never overlaps message history. The code panel auto-grows with its content up to a 65vh cap, and the user can manually drag a handle to resize it (also capped at 65vh).

## Changes

### 1. `src/components/Composer.tsx` — adaptive + draggable Monaco

- Replace the hard-coded `height="220px"` on `MonacoEditor` with a controlled `editorHeight` state.
- On editor mount, subscribe to Monaco's `onDidContentSizeChange` and set `editorHeight = clamp(contentHeight, MIN, autoMax)` where:
  - `MIN = 140px`
  - `autoMax = min(0.65 * window.innerHeight - chromeOffset, userMaxIfDragged)`
  - `chromeOffset` ≈ toolbar + paddings + composer chrome (~140px), so the whole composer stays within 65vh.
- Track `userHeight: number | null`. If the user drags, `userHeight` overrides auto-fit (still clamped to 65vh cap). A small "reset" affordance (double-click handle) clears `userHeight` to return to auto-fit.
- Add a drag handle bar at the **top edge** of the code panel (just above the Monaco container): 6px tall, full width, `cursor: ns-resize`, themed via tokens. On `pointerdown` capture pointer; on move, compute delta and update `userHeight` (clamped to [MIN, 0.65 * vh - chromeOffset]).
- Recompute the cap on `window resize` so 65vh stays accurate.
- Keep the existing morph animation but key it only on `mode` (not `lang`), since height now changes continuously via Monaco/drag rather than a single tween. Remove the `power3.out` tween on `editorHeight` changes (CSS `transition: height 120ms ease-out` on the Monaco wrapper instead, so resize feels live).
- When mode flips text↔code, still tween wrapper height once for the morph.

### 2. `src/routes/chat.tsx` — already reserves composer height, minor polish

- The existing `ResizeObserver` on `composerWrapRef` already updates `paddingBottom = composerHeight + 24`, which is exactly the "push chat up, never cover history" behavior the user wants — when the composer grows (auto-fit or drag), the scroll content reserves the new space.
- Add a single guard: when `composerHeight` grows, only auto-scroll if the user is within 120px of the bottom (already in place). Confirm no change needed here; only update the `paddingBottom` formula to `composerHeight + 16` for tighter spacing.
- No layout-flow change — composer stays `fixed` at bottom so it remains pinned while scrolling history upward.

### 3. No CSS file changes required

Tokens already cover the handle color (`border` / `muted-foreground`).

## Technical notes

- `0.65 * window.innerHeight` is read from `window.innerHeight` inside a `useEffect` + `resize` listener; SSR-safe via `typeof window` check.
- `chromeOffset` is measured from the composer wrapper: `composerWrapRef.current.offsetHeight - editorHeight` after first paint, so it stays accurate if toolbar height changes.
- Drag implementation uses `pointerdown`/`pointermove`/`pointerup` with `setPointerCapture` on the handle; no global listeners needed.
- Monaco's `editor.getContentHeight()` returns the natural content height; `onDidContentSizeChange` fires on every line add/remove.

## Out of scope

- No changes to message rendering, header, ambient canvas, fonts, colors, footer, or text-mode composer behavior.
- No new dependencies.

## Files

- `src/components/Composer.tsx`
- `src/routes/chat.tsx` (one-line padding tweak only)
