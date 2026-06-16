## Issues
1. Toggle is only in the chat header — not present on `/login`.
2. Light mode appears broken because `src/styles.css` has both `@media (prefers-color-scheme: dark) { :root { ... } }` AND `.dark { ... }`. When the OS is dark, the media query keeps overriding `:root` even after the user toggles light — `.dark` class is removed but dark tokens still apply. Result: toggling to light does nothing on dark-OS machines.

## Changes

### `src/styles.css`
- Delete the `@media (prefers-color-scheme: dark) { :root { ... } }` block entirely. The init script in `__root.tsx` already reads `prefers-color-scheme` and adds the `.dark` class when needed, so we don't need the media query — and removing it lets `.dark` (or its absence) be the single source of truth. The pure-white + rainbow light theme in `:root` then actually applies when toggled to light.

### `src/components/ThemeToggle.tsx`
- Add an optional `floating` prop. When set, render the button as `position: fixed; bottom: 18px; left: 18px; z-index: 50;` with a subtle backdrop (surface bg, border, soft shadow) so it stays legible on any page. Keep the existing inline variant for the chat header.

### `src/routes/__root.tsx`
- Render `<ThemeToggle floating />` once inside `RootComponent` (alongside `<Outlet />`) so it appears on every route — login, chat, 404, error.

### `src/routes/chat.tsx`
- Remove the inline `<ThemeToggle />` from the chat header (the floating one replaces it). Keep the Appearance row inside `SettingsMenu`.

## Out of scope
- No color-token changes (the existing `:root` already holds the requested yellow/orange/pink/purple/blue palette on pure white).
- No layout changes elsewhere.

## Files
- `src/styles.css`
- `src/components/ThemeToggle.tsx`
- `src/routes/__root.tsx`
- `src/routes/chat.tsx`
