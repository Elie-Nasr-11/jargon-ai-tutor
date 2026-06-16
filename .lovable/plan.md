## Changes

### 1. Color system — pure white + rainbow-only palette (light + dark)
Rewrite `src/styles.css` so the chrome stays neutral and the only color is the rainbow gradient (yellow → orange → pink → purple → blue).

- `:root` (light): `--background: #ffffff`, `--surface: #f6f6fb`, `--surface-hover: #f9f9fe`, ink `rgba(10,10,10,0.92)`, emphasis `#0a0a0a`. Text opacity ladder via tokens: `--ink-92/62/45/30/16`.
- `.dark`: `--background: #0b0b0d`, `--surface: #161619`, `--surface-hover: #1f1f23`, ink `rgba(245,245,247,0.92)`, emphasis `#f0f0f2`. Wire via `@custom-variant dark` + `@theme inline`.
- Rainbow tokens (used by `.grad-border`, `.grad-text`, progress bar, focus rings, toasts):
  - `--grad-1: #f6d36b` yellow
  - `--grad-2: #f9a86b` orange
  - `--grad-3: #f585bb` pink
  - `--grad-4: #8fa4ef` periwinkle/purple
  - `--grad-5: #72b8f5` blue
  Update the `.grad-border` and `.grad-text` linear-gradients to use all five stops at 0/25/50/75/100%.
- Replace any rose/red error styling in `chat.tsx` output block with neutral surface + pink-from-gradient accent so we stay inside the allowed palette.
- Remove the `bg-stone/neutral` Tailwind reliance — components already use `bg-muted`, `bg-foreground`, `bg-background` semantic tokens, which now resolve to the new values.
- Add a `<html class="dark">` toggle hook is out of scope; we expose the dark tokens so the system-preference media query (`@media (prefers-color-scheme: dark)`) flips them automatically. (No new UI toggle unless you want one.)

### 2. Smoother open/close + selection animations
Replace abrupt mounts with GSAP timelines that animate both in and out, plus `FLIP`-style cross-fades for selections.

- **Composer (open/close code window & language switch)** — `src/components/Composer.tsx`:
  - Track `mode` change with an exit animation: animate current panel's `height`, `opacity`, `y` to 0 before swapping to the next; use a single `wrapRef` with `gsap.timeline` (`power3.inOut`, ~0.35s) and `overflow: hidden` measurement.
  - Language toggle (JS ↔ Py): animate the active pill with GSAP `Flip` (or a sliding `::before` indicator) — the pill background slides between the two segments in ~0.25s instead of an instant class swap. Crossfade the helper text below.
- **Lessons menu (`HeaderMenus.tsx > LessonsPanel`)**:
  - Replace the static black `.dot-indicator.active` with a single absolutely-positioned indicator `<div>` that GSAP animates to the selected row's `y`/`height` on click (~0.3s `power3.out`). Selected text color fades via GSAP.
- **Mentor menu (`MentorPanel`)**:
  - For each option group, render a single absolutely-positioned pill background and slide it (`gsap.to` `x`/`width`) to the chosen option on click; foreground text color crossfades. No layout jump.
- **Menu panels open/close**: extend the existing `MenuPanel` to also play a reverse tween on unmount via a small `AnimatePresence`-style helper (local `useExitAnimation` hook around `gsap.to(..., {onComplete: setNull})`) so panels fade out instead of disappearing instantly. Same treatment for `SettingsMenu` dropdown.

### 3. Settings menu — remove Profile
In `src/components/SettingsMenu.tsx`, delete the "Profile" button and the `User` import. Keep "Signed in" header and "Log out".

### 4. Login landing — trim the card
In `src/routes/login.tsx`:
- Keep the eyebrow pill (`Jargon AI tutor`), the `h1` headline, and the subtitle paragraph above the card.
- Inside the card: keep Email, Password, Continue button.
- Remove the helper text: `"Sketch build — any credentials get you in."`

### 5. Ambient + accents stay on-palette
- `AmbientCanvas` shader colors: re-map to the 5 rainbow stops so the background glow uses only yellow/orange/pink/purple/blue (very low alpha over white / over `#0b0b0d`).

### Out of scope
No dark-mode UI toggle button, no backend changes, no new routes, no message/bot logic changes.

### Files touched
- `src/styles.css` (rewrite tokens + gradient)
- `src/components/Composer.tsx` (animated open/close + animated lang pill)
- `src/components/HeaderMenus.tsx` (animated lesson dot + mentor pill, exit animations)
- `src/components/SettingsMenu.tsx` (remove Profile, exit animation)
- `src/components/AmbientCanvas.tsx` (palette swap)
- `src/routes/login.tsx` (remove helper line)
- `src/routes/chat.tsx` (output error styling → neutral)
