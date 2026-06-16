import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { GradientCard } from "./GradientCard";
import { LESSONS, store, type MentorConfig } from "@/lib/jargon-store";

type MenuKey = "lessons" | "progress" | "mentor" | null;

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
  const [open, setOpen] = useState<MenuKey>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = (k: MenuKey) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(k);
  };
  const leave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };

  const items: { key: Exclude<MenuKey, null>; label: string }[] = [
    { key: "lessons", label: "Lessons" },
    { key: "progress", label: "Progress" },
    { key: "mentor", label: "Mentor" },
  ];

  return (
    <nav className="relative flex items-center gap-1" onMouseLeave={leave}>
      {items.map((it) => (
        <button
          key={it.key}
          onMouseEnter={() => enter(it.key)}
          onFocus={() => enter(it.key)}
          className={`relative rounded-full px-3.5 py-1.5 text-[13.5px] tracking-tight transition-colors ${
            open === it.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {it.label}
        </button>
      ))}

      {open && (
        <div
          onMouseEnter={() => enter(open)}
          onMouseLeave={leave}
          className="absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2"
          style={{ width: open === "mentor" ? 380 : 360 }}
        >
          <MenuPanel keyName={open}>
            {open === "lessons" && (
              <LessonsPanel activeId={activeLessonId} onSelect={onSelectLesson} />
            )}
            {open === "progress" && <ProgressPanel activeId={activeLessonId} />}
            {open === "mentor" && <MentorPanel mentor={mentor} onChange={onMentorChange} />}
          </MenuPanel>
        </div>
      )}
    </nav>
  );
}

function MenuPanel({ keyName, children }: { keyName: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const tl = gsap.fromTo(
      ref.current,
      { y: -8, opacity: 0, scale: 0.985 },
      { y: 0, opacity: 1, scale: 1, duration: 0.24, ease: "power3.out" },
    );
    return () => {
      tl.kill();
    };
  }, [keyName]);
  return (
    <div ref={ref}>
      <GradientCard>
        <div className="p-5">{children}</div>
      </GradientCard>
    </div>
  );
}

function LessonsPanel({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="font-serif text-[22px] leading-tight tracking-tight">Lessons</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">Pick the thread to follow.</p>
      <div className="mt-5 space-y-1">
        {LESSONS.map((l) => {
          const active = l.id === activeId;
          return (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className="group flex w-full items-start gap-3 rounded-md px-1 py-2 text-left transition-colors hover:bg-muted/60"
            >
              <span className={`dot-indicator ${active ? "active" : ""}`} style={{ minHeight: 38 }} />
              <span className="flex-1">
                <span className="block text-[14.5px] font-medium tracking-tight text-foreground">
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
          className="h-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--grad-1), var(--grad-2), var(--grad-3), var(--grad-4))",
          }}
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
                className="block h-full bg-foreground/70"
                style={{ width: `${Math.round(l.progress * 100)}%` }}
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
          <div key={g.key}>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {g.label}
            </div>
            <div className="flex gap-1.5">
              {g.options.map((opt) => {
                const active = mentor[g.key] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() =>
                      onChange({ ...mentor, [g.key]: opt } as MentorConfig)
                    }
                    className={`flex-1 rounded-full border px-2.5 py-1.5 text-[12.5px] transition-all ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
