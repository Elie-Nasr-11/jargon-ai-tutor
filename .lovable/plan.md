## Goal
Fix the jittery/laggy header menu and add a light/dark mode toggle.

## 1. Header menu — eliminate the lag/jitter

Current issues:
- Switching tabs unmounts the panel, waits 160ms via `setTimeout`, then remounts and re-runs the entrance tween → visible flicker + dropped frames.
- `width` is computed per `mountedKey` so the panel jumps size between tabs instead of morphing.
- Indicators (lessons bar, mentor pill) start at `width:0`/`height:24` and only animate after `useLayoutEffect`, so the first open shows the indicator collapsed for a frame.
- Hover hand-off between trigger and panel relies on overlapping mouse events + a `setTimeout(140)` close, which races and causes the panel to flicker closed.

Refactor `src/components/HeaderMenus.tsx`:
- Keep the panel **mounted as long as any tab is hovered**; switch content via a single `activeKey` state. No unmount between tab hops.
- Drive open/close with one GSAP timeline stored in a ref (`tl.current`): `tl.play()` on enter, `tl.reverse()` on leave. Kill on unmount. This removes the setTimeout chain entirely.
- Animate **width + height** of the panel container with GSAP when `activeKey` changes (measure the inner content with a hidden sizer or `getBoundingClientRect`, then `gsap.to({ width, height, duration: 0.32, ease: "power3.out" })`). Crossfade the inner content (`opacity`/`y: 4`) on key change.
- Single shared close timer; `onMouseEnter` on both nav and panel cancels it. Close delay reduced to ~90ms.
- Add `will-change: transform, opacity` + `transform: translateZ(0)` on the panel and indicators to keep them on their own GPU layer.
- `LessonsPanel` indicator: set initial `y`/`height` synchronously with `gsap.set` before paint (already `useLayoutEffect`, but currently uses `gsap.to` from the CSS default — switch to `gsap.set` on first run, `gsap.to` on subsequent updates via a `didMount` ref).
- `MentorPanel` pill: same pattern — `gsap.set` on first paint so it never flashes at `width:0`.

Net effect: tabs slide between each other, panel resizes smoothly, no remount, no flicker.

## 2. Light/dark mode toggle

- New `src/lib/theme.ts`: tiny `useTheme()` hook. Reads `localStorage.jargon-theme` (`"light" | "dark" | "system"`, default `"system"`), applies `.dark` class to `document.documentElement`, listens to `prefers-color-scheme` while in system mode. Exposes `{ theme, resolved, setTheme, toggle }`.
- Apply theme synchronously on first client render (small `<script>` injected via `__root.tsx` `head().scripts` to avoid FOUC, reading the same localStorage key).
- Add a Sun/Moon icon button in the chat header next to `SettingsMenu` (in `src/routes/chat.tsx`), same 36×36 ghost-button styling. Click toggles light/dark. `aria-label` reflects current state. Subtle GSAP rotate/scale on icon swap.
- Also expose the toggle inside `SettingsMenu` as a third row ("Appearance · Light/Dark") with the same handler, so it's discoverable.
- `AmbientCanvas` already reads CSS vars indirectly — verify backdrop reads `--background`; no shader change needed since palette is theme-agnostic over white/near-black.

## Out of scope
- No bot/logic changes, no new routes, no backend.
- Login page styling untouched aside from inheriting theme tokens it already uses.

## Files touched
- `src/components/HeaderMenus.tsx` (rewrite menu state machine + indicators)
- `src/components/SettingsMenu.tsx` (add appearance row)
- `src/routes/chat.tsx` (theme toggle button in header)
- `src/routes/__root.tsx` (FOUC-prevention inline script)
- `src/lib/theme.ts` (new)
