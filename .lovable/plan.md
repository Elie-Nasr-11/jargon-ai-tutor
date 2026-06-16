## Goal

Make the chatbox/codebox mechanic stable: no jitter when opening or typing, no awkward drag behavior, and no chat history hidden behind the composer unless the user intentionally scrolls upward.

## Plan

### 1. Replace the unstable auto-height editor behavior

In `src/components/Composer.tsx`:

- Remove Monaco `onDidContentSizeChange` as the source of live React height updates. That event fires frequently while typing and causes re-render/resize jitter.
- Use a simpler, stable sizing model:
  - Text mode stays compact.
  - Code mode opens at a fixed comfortable default height.
  - The editor can be manually resized by dragging.
  - Max composer height is capped at 65% of viewport height.
- Keep Monaco itself scrollable inside the editor when content exceeds the current editor height, instead of constantly resizing the panel while typing.

### 2. Fix drag behavior

In `src/components/Composer.tsx`:

- Store dragging state in React state/ref cleanly so transition is disabled while dragging.
- Attach pointer move/up handlers to `window` during drag instead of relying only on the small handle receiving pointer events. This prevents the drag from dropping when the pointer leaves the handle.
- Clamp drag results between a minimum editor height and the computed max available height.
- Make dragging upward increase height and dragging downward decrease height.
- Remove the auto-fit double-click behavior for now because it conflicts with predictable manual sizing.

### 3. Make composer height reports reliable

In `src/routes/chat.tsx`:

- Keep the fixed bottom composer, but make the scroll container reserve space using the measured composer height.
- Change the bottom padding to include the composer height plus a clear safety gap so the last message never sits under the composer.
- Track whether the user is near the bottom before composer size changes; only follow the bottom if they were already near the bottom.
- Use instant scroll adjustments during resize/drag to avoid smooth-scroll fighting the drag operation.

### 4. Stop unnecessary scroll fighting

In `src/routes/chat.tsx`:

- Keep auto-scroll for new messages.
- Do not continuously smooth-scroll while the composer is resizing; this is likely part of the current “buggy” feeling.
- Preserve hidden scrollbar behavior.

## Expected behavior

- Opening the code editor pushes visible chat history upward instead of covering it.
- Typing code no longer jitters the editor height.
- If code content grows beyond the editor height, Monaco scrolls internally.
- Dragging the codebox feels steady and predictable.
- The composer remains fixed at the bottom, but the chat history has enough bottom padding to remain readable.

## Files

- `src/components/Composer.tsx`
- `src/routes/chat.tsx`
