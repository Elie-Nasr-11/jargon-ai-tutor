import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { GradientCard } from "./GradientCard";
import { LESSONS, type MentorConfig } from "@/lib/jargon-store";

type MenuKey = "lessons" | "progress" | "mentor";

const WIDTHS: Record<MenuKey, number> = {
  lessons: 380,
  progress: 380,
  mentor: 380,
};

export function HeaderMenus({
  activeLessonId,
  onSelectLesson,
  mentor,
  onMentorChange,
}: {
  activeLessonId: string;
  onSelectLesson: (id: string) => void;
  mentor: MentorConfig;
  onMentorChange: (m: MentorConfig) => void;
}) {
  const [activeKey, setActiveKey] = useState<MenuKey | null>(null);
  const [contentKey, setContentKey] = useState<MenuKey | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(false);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const enter = (k: MenuKey) => {
    cancelClose();
    setActiveKey(k);
  };
  const leave = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActiveKey(null), 110);
  };

  // open/close
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (activeKey) {
      if (!contentKey) {
        setContentKey(activeKey);
        return; // wait for next render with contentKey set so panel is visible
      }
      if (!isOpenRef.current) {
        isOpenRef.current = true;
        gsap.killTweensOf(panel);
        gsap.fromTo(
          panel,
          { y: -6, opacity: 0, scale: 0.985 },
          { y: 0, opacity: 1, scale: 1, duration: 0.24, ease: "power3.out" },
        );
      }
    } else if (isOpenRef.current) {
      isOpenRef.current = false;
      gsap.killTweensOf(panel);
      gsap.to(panel, {
        y: -4,
        opacity: 0,
        scale: 0.985,
        duration: 0.16,
        ease: "power2.in",
      });
    }
  }, [activeKey, contentKey]);

  // crossfade + size morph when active changes
  useLayoutEffect(() => {
    if (!activeKey || !panelRef.current || !innerRef.current) return;
    if (activeKey === contentKey) {
      // initial size set
      const targetW = WIDTHS[activeKey];
      const h = sizerRef.current?.offsetHeight ?? innerRef.current.offsetHeight;
      gsap.set(panelRef.current, { width: targetW, height: h });
      return;
    }
    // morph to new content
    const targetW = WIDTHS[activeKey];
    const inner = innerRef.current;
    gsap.killTweensOf(inner);
    gsap.to(inner, {
      opacity: 0,
      y: 4,
      duration: 0.12,
      ease: "power2.in",
      onComplete: () => {
        setContentKey(activeKey);
        requestAnimationFrame(() => {
          const h = sizerRef.current?.offsetHeight ?? inner.offsetHeight;
          gsap.to(panelRef.current, {
            width: targetW,
            height: h,
            duration: 0.32,
            ease: "power3.out",
          });
          gsap.fromTo(
            inner,
            { opacity: 0, y: 4 },
            { opacity: 1, y: 0, duration: 0.22, ease: "power2.out", delay: 0.04 },
          );
        });
      },
    });
  }, [activeKey, contentKey]);

  const items: { key: MenuKey; label: string }[] = [
    { key: "lessons", label: "Lessons" },
    { key: "progress", label: "Progress" },
    { key: "mentor", label: "Mentor" },
  ];

  return (
    <nav
      ref={wrapRef}
      className="relative flex items-center gap-1"
      onMouseLeave={leave}
      onMouseEnter={cancelClose}
    >
      {items.map((it) => (
        <button
          key={it.key}
          onMouseEnter={() => enter(it.key)}
          onFocus={() => enter(it.key)}
          className={`relative rounded-full px-3.5 py-1.5 text-[13.5px] tracking-tight transition-colors ${
            activeKey === it.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {it.label}
        </button>
      ))}

      <div
        ref={panelRef}
        onMouseEnter={cancelClose}
        onMouseLeave={leave}
        className="pointer-events-auto absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2"
        style={{
          width: contentKey ? WIDTHS[contentKey] : 380,
          opacity: 0,
          willChange: "transform, opacity, width, height",
          transform: "translateZ(0)",
          display: contentKey ? "block" : "none",
        }}
      >
        <div ref={sizerRef}>
          <GradientCard>
            <div ref={innerRef} style={{ willChange: "transform, opacity" }}>
              <div className="p-5">
                {contentKey === "lessons" && (
                  <LessonsPanel activeId={activeLessonId} onSelect={onSelectLesson} />
                )}
                {contentKey === "progress" && <ProgressPanel activeId={activeLessonId} />}
                {contentKey === "mentor" && (
                  <MentorPanel mentor={mentor} onChange={onMentorChange} />
                )}
              </div>
            </div>
          </GradientCard>
        </div>
      </div>
    </nav>
  );
}

function LessonsPanel({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    const ind = indicatorRef.current;
    if (!list || !ind) return;
    const idx = LESSONS.findIndex((l) => l.id === activeId);
    const row = list.children[idx + 1] as HTMLElement | undefined; // +1 because indicator is first child
    if (!row) return;
    const props = {
      y: row.offsetTop + 6,
      height: row.offsetHeight - 12,
    };
    if (!didMount.current) {
      gsap.set(ind, props);
      didMount.current = true;
    } else {
      gsap.to(ind, { ...props, duration: 0.38, ease: "power3.out" });
    }
  }, [activeId]);

  return (
    <div>
      <h3 className="font-serif text-[22px] leading-tight tracking-tight">Lessons</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">Pick the thread to follow.</p>
      <div ref={listRef} className="relative mt-5">
        <div
          ref={indicatorRef}
          aria-hidden
          className="pointer-events-none absolute left-1 top-0 w-[3px] rounded-full bg-foreground"
          style={{
            height: 24,
            willChange: "transform, height",
          }}
        />
        {LESSONS.map((l) => {
          const active = l.id === activeId;
          return (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className="group relative flex w-full items-start gap-3 rounded-md py-2 pl-5 pr-1 text-left transition-colors hover:bg-muted/60"
            >
              <span className="flex-1">
                <span
                  className={`block text-[14.5px] font-medium tracking-tight transition-colors ${
                    active ? "text-foreground" : "text-foreground/85"
                  }`}
                >
                  {l.title}
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                  {l.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgressPanel({ activeId }: { activeId: string }) {
  const active = LESSONS.find((l) => l.id === activeId) ?? LESSONS[0];
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(
      barRef.current,
      { width: 0 },
      { width: `${Math.round(active.progress * 100)}%`, duration: 0.9, ease: "power3.out" },
    );
  }, [active.id, active.progress]);
  return (
    <div>
      <h3 className="font-serif text-[22px] leading-tight tracking-tight">Progress</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">{active.title}</p>
      <div className="mt-4 h-[5px] w-full overflow-hidden rounded-full bg-muted">
        <div
          ref={barRef}
          className="h-full rounded-full bg-foreground"
        />
      </div>
      <div className="mt-1 flex justify-between text-[11.5px] text-muted-foreground">
        <span>{Math.round(active.progress * 100)}% complete</span>
        <span>{Math.max(0, Math.round((1 - active.progress) * 24))} min left</span>
      </div>

      <div className="mt-5 space-y-2">
        {LESSONS.filter((l) => l.id !== active.id).map((l) => (
          <div key={l.id} className="flex items-center gap-3">
            <span className="flex-1 truncate text-[13px] text-foreground">{l.title}</span>
            <span className="h-[3px] w-20 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full bg-foreground"
                style={{
                  width: `${Math.round(l.progress * 100)}%`,
                }}
              />
            </span>
            <span className="w-8 text-right text-[11.5px] tabular-nums text-muted-foreground">
              {Math.round(l.progress * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MentorPanel({
  mentor,
  onChange,
}: {
  mentor: MentorConfig;
  onChange: (m: MentorConfig) => void;
}) {
  const groups: { key: keyof MentorConfig; label: string; options: MentorConfig[keyof MentorConfig][] }[] = [
    { key: "tone", label: "Tone", options: ["Friendly", "Direct", "Socratic"] },
    { key: "verbosity", label: "Verbosity", options: ["Concise", "Balanced", "Detailed"] },
    { key: "difficulty", label: "Difficulty", options: ["Gentle", "Standard", "Challenging"] },
  ];
  return (
    <div>
      <h3 className="font-serif text-[22px] leading-tight tracking-tight">Mentor</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">Shape how the tutor talks back.</p>
      <div className="mt-5 space-y-4">
        {groups.map((g) => (
          <MentorGroup
            key={g.key as string}
            label={g.label}
            options={g.options as string[]}
            value={mentor[g.key] as string}
            onSelect={(opt) => onChange({ ...mentor, [g.key]: opt } as MentorConfig)}
          />
        ))}
      </div>
    </div>
  );
}

function MentorGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (opt: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const didMount = useRef(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const pill = pillRef.current;
    if (!row || !pill) return;
    const idx = options.indexOf(value);
    const btn = btnRefs.current[idx];
    if (!btn) return;
    const props = { x: btn.offsetLeft, width: btn.offsetWidth };
    if (!didMount.current) {
      gsap.set(pill, props);
      didMount.current = true;
    } else {
      gsap.to(pill, { ...props, duration: 0.34, ease: "power3.out" });
    }
  }, [value, options]);

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div
        ref={rowRef}
        className="relative flex gap-1.5 rounded-full border border-border p-[3px]"
      >
        <div
          ref={pillRef}
          aria-hidden
          className="absolute left-0 top-[3px] h-[calc(100%-6px)] rounded-full bg-foreground"
          style={{ width: 0, willChange: "transform, width" }}
        />
        {options.map((opt, i) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              onClick={() => onSelect(opt)}
              className={`relative z-10 flex-1 rounded-full px-2.5 py-1.5 text-[12.5px] transition-colors ${
                active ? "text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Silence unused-import warning for ReactNode in some configs
export type _R = ReactNode;
