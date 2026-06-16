## Goal
Make the top-nav menus (Lessons / Progress / Mentor) and the Settings menu work cleanly on mobile: tap-driven, properly sized for the viewport, and large enough for fingers.

## Problems today
- `HeaderMenus` opens/closes via `onMouseEnter` / `onMouseLeave` only — on touch there is no hover, so tapping a tab does nothing reliable.
- Panel width is hard-coded to `380px` and absolutely positioned under the tab. On a 360–390px phone it overflows the viewport edge and gets clipped.
- Tab buttons (`px-3.5 py-1.5`, ~28px tall) and Settings icon button (36×36) are below the ~44px touch-target minimum.
- Lesson/mentor rows and the appearance/logout rows are small dense hit areas.
- Settings panel closes on `mousedown` only — no `touchstart`/`pointerdown` equivalent, so outside-tap close is flaky on mobile.

## Plan

### 1. `src/components/HeaderMenus.tsx` — tap to open, sheet on mobile
- Drive open state from **click/tap** as the primary interaction, keeping hover as a desktop enhancement (`(hover: hover)` media query check via `matchMedia`). On touch: tap a tab to open, tap again or tap outside to close; tapping another tab swaps content.
- Add an outside-tap close listener using `pointerdown` (covers mouse + touch + pen) instead of relying on `mouseleave`.
- Add `Escape` key to close.
- Mobile layout (`< 640px`):
  - Tab row: increase hit area to `min-h-[44px]`, larger text, more horizontal padding; allow horizontal scroll if it ever overflows.
  - Panel becomes a **bottom sheet**: fixed to the viewport, full width minus 16px gutter, max-height ~75vh, internal scroll, with a small drag-handle bar at the top. Slide-up animation instead of the desktop drop-down + width morph (which assumes 380px and centered-under-tab positioning).
  - Backdrop dim layer behind the sheet to make outside-tap obvious.
- Desktop (`≥ 640px`): keep current behavior (drop-down panel, width morph, hover-open).
- Inside panels (`LessonsPanel`, `MentorPanel`), bump row padding so each row is ≥44px tall on mobile; MentorGroup pill buttons get `py-2.5` on mobile.

### 2. `src/components/SettingsMenu.tsx` — touch-friendly + outside-tap fix
- Switch outside-close listener from `mousedown` to `pointerdown`.
- Trigger button: keep 36×36 on desktop, bump to 44×44 on mobile.
- Panel: on mobile, anchor to the right edge with `right-2` and clamp width to `min(280px, calc(100vw - 16px))` so it never clips.
- Menu rows (`Appearance`, `Log out`): increase to `py-3` on mobile for a 44px-ish target.
- Add `Escape` key to close.

### 3. `src/routes/chat.tsx` — header spacing on small screens
- Header inner container: reduce horizontal padding to `px-4` on mobile (keep `px-6` on `sm:`), and let the menu nav shrink. No layout changes beyond that.

## Out of scope
- No changes to chat composer, code editor, scroll behavior, or message rendering.
- No visual redesign of the panels' content — same typography and gradient card; only sizing, positioning, and interaction model change.

## Files
- `src/components/HeaderMenus.tsx`
- `src/components/SettingsMenu.tsx`
- `src/routes/chat.tsx` (header padding only)
