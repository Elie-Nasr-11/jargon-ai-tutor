
# Jargon — Sketch PWA Plan

A fully mocked, ultra-minimal educational chat PWA. No backend. Pure frontend with Three.js ambient visuals, GSAP-driven motion, and Pyodide for in-browser Python.

## Visual language (locked to reference)

- **Palette**: off-white `#fafaf9` background, near-black `#0a0a0a` text, muted gray `#6b7280` for secondary, soft card surface `#f5f5f4`.
- **Typography**:
  - Headings: **Instrument Serif** (matches the elegant serif in refs — "Hyper-personalized", "Data monetization").
  - UI / body: **Inter** (matches the clean sans in refs — "Recognize", "Visitor recognized").
- **Gradient border** (exact match to refs — pill + notification card): conic/linear `from #a78bfa → #60a5fa → #fcd34d → #fb7185 → #a78bfa`. Implemented as a 1.5px wrapper using `background: linear-gradient(...)` + inner solid card with `border-radius` inset.
- **Spacing**: generous (24–48px), rounded corners `rounded-2xl` (16px) on cards, `rounded-full` on pills.
- **Shadows**: barely-there, e.g. `0 1px 2px rgba(0,0,0,0.04)`.

## Tech & dependencies

- Existing TanStack Start stack.
- Add: `three`, `gsap`, `@monaco-editor/react` (lightweight code editor), Pyodide loaded via CDN script tag on demand.
- PWA: manifest + icons only (installable, no service worker), per the PWA skill's manifest-only path.

## Routes

```
src/routes/
  __root.tsx          (shell, fonts, ambient Three.js canvas, GSAP context)
  index.tsx           (redirects → /login or /chat based on localStorage flag)
  login.tsx           (email + password, mocked — any input proceeds)
  chat.tsx            (main app: header + chat window)
```

Auth is mocked: clicking "Continue" sets `localStorage.jargon_user` and navigates to `/chat`. Logout clears it.

## Layout — `/chat`

### Header (sticky, translucent backdrop-blur)
- **Left**: `Jargon` wordmark (Instrument Serif, 22px).
- **Center**: three hover-menu triggers — `Lessons`, `Progress`, `Mentor`.
  - On hover: GSAP animates a gradient-bordered card down from the trigger (fade + 8px y-slide + scale 0.98→1, 240ms ease-out). Card stays open while pointer is over trigger or panel.
  - **Lessons panel**: vertical list of mock lessons (Intro to Variables, Functions, Async, …) with the same "active dot + faded dot" indicator from the "Recognize / Learn / Reach out / Interact" reference. Click selects.
  - **Progress panel**: current lesson progress bar (animated fill via GSAP) + small list of other lessons with % complete.
  - **Mentor panel**: 3 personality selectors as segmented pills — Tone (Friendly / Direct / Socratic), Verbosity (Concise / Balanced / Detailed), Difficulty (Gentle / Standard / Challenging). Stored in localStorage.
- **Right**: settings gear icon → click opens small gradient-bordered dropdown with `Profile` and `Logout`.

### Chat window (center column, max-w-3xl)
- Message list: user messages right-aligned plain text; bot messages left-aligned with subtle fade-in (GSAP stagger on tokens).
- Bot can return code blocks rendered with syntax highlighting; each code block has a `Run` button and a `Open in editor` button.
- **Composer** (bottom): gradient-bordered input pill (matches "Visitor recognized" ref) with:
  - Text mode: textarea + send button.
  - **Code mode toggle** (`</>` icon): swaps the textarea for a Monaco editor with a language switch (JS / Python) and a `Run ▶` button. Output appears as the next message in the chat.
- **Execution**:
  - JS: runs in a sandboxed `<iframe sandbox="allow-scripts">` with `postMessage` to capture `console.log` + return value.
  - Python: lazy-loads Pyodide from CDN on first run, shows "Booting Python…" shimmer (GSAP), then executes and pipes stdout back.
- **Bot "view & control"**: mocked bot can issue control messages like `/* jargon: insert */` that the chat reducer interprets to: insert code into the editor, run it, or read current editor contents. All client-side, deterministic mock responses keyed on a few sample prompts ("show me a for loop", "run it", "make it python", etc.); fallback canned reply for anything else.

### Loading / sending / running states
- Sending: gradient border on input animates a hue rotation (GSAP `to` on a CSS var).
- Bot thinking: three-dot shimmer with GSAP timeline.
- Running code: small spinner inside Run button; output card fades in.

## Three.js ambient

One shared canvas in `__root.tsx`, `position: fixed`, `pointer-events: none`, very low opacity (~0.5). A slow shader-based gradient mesh (plane + custom fragment shader with smooth noise, animated `uTime`). Colors pulled from the same conic palette. Pauses when tab hidden. Disabled on `prefers-reduced-motion`.

On `/login`: same canvas but more prominent (opacity 0.9, larger turbulence amplitude) — GSAP tweens the shader uniform when navigating between routes.

Hover menu mechanics also use a tiny per-panel WebGL plane behind the card for a soft animated gradient wash (cheap; reuses one shared renderer pattern).

## Gradient border component

Single reusable `<GradientCard>`:
```
.wrapper { padding: 1.5px; border-radius: 18px;
  background: linear-gradient(135deg,#a78bfa,#60a5fa,#fcd34d,#fb7185,#a78bfa);
  background-size: 200% 200%; animation: shift 8s linear infinite; }
.inner { background: #fafaf9; border-radius: 16.5px; }
```
Used for: login card, notification-style toasts, hover-menu panels, chat composer, settings dropdown, "important" bot messages.

## PWA

- `public/manifest.webmanifest` with `name: "Jargon"`, `short_name: "Jargon"`, `display: "standalone"`, theme `#fafaf9`, background `#fafaf9`.
- Generate a simple monogram icon (J in Instrument Serif on off-white) at 192/512.
- Head tags for manifest + apple-touch-icon. No service worker.

## Out of scope (sketch)

- No real auth, no DB, no real LLM calls. Bot responses are scripted.
- No multi-user, no persistence beyond localStorage (mentor settings, selected lesson, auth flag, chat history of current session).

## Technical notes section

- Pyodide loaded via `<script src="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js">` injected on first Python run; wrapped in client-only effect (no SSR).
- Monaco via `@monaco-editor/react`, dynamically imported to keep initial bundle small.
- Three.js scene created in a `useEffect` in `__root.tsx`, single renderer, `requestAnimationFrame` loop with visibility-change pause.
- All GSAP work inside `gsap.context()` for cleanup on unmount.
- `prefers-reduced-motion`: all GSAP timelines respect `gsap.matchMedia`; Three canvas opacity drops to 0 and animation halts.
