import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import gsap from "gsap";
import { AmbientCanvas } from "@/components/AmbientCanvas";
import { HeaderMenus } from "@/components/HeaderMenus";
import { SettingsMenu } from "@/components/SettingsMenu";
import { Composer } from "@/components/Composer";
import { GradientCard } from "@/components/GradientCard";
import { store, DEFAULT_MENTOR, type MentorConfig, LESSONS } from "@/lib/jargon-store";
import { botReply } from "@/lib/bot";
import type { RunResult } from "@/lib/code-runner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Jargon" },
      { name: "description", content: "Your conversation with Jargon." },
    ],
  }),
  component: ChatPage,
});

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "bot"; text: string; code?: { language: "javascript" | "python"; source: string } }
  | { id: string; role: "output"; ok: boolean; output: string; lang: "javascript" | "python" }
  | { id: string; role: "thinking" };

const uid = () => Math.random().toString(36).slice(2);

function ChatPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string>(LESSONS[0].id);
  const [mentor, setMentor] = useState<MentorConfig>(DEFAULT_MENTOR);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: uid(),
      role: "bot",
      text:
        "Welcome to Jargon. I'm your mentor for this session \u2014 ask me anything, or tap the \u2039/\u203A icon to drop into the editor.",
    },
  ]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerWrapRef = useRef<HTMLDivElement>(null);
  const [composerHeight, setComposerHeight] = useState(96);

  useEffect(() => {
    const u = store.getUser();
    if (!u) {
      navigate({ to: "/login" });
      return;
    }
    setEmail(u);
    setLessonId(store.getLessonId());
    setMentor(store.getMentor());
  }, [navigate]);

  // Track composer height so the scroll area always reserves the right space.
  useEffect(() => {
    const el = composerWrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setComposerHeight((prev) => {
        const next = el.offsetHeight;
        // If we were near the bottom, follow the growth smoothly.
        const sc = scrollRef.current;
        if (sc) {
          const distance = sc.scrollHeight - sc.scrollTop - sc.clientHeight;
          if (next > prev && distance < 120) {
            requestAnimationFrame(() => {
              sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
            });
          }
        }
        return next;
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);


  const addMsg = (m: Msg) => setMsgs((prev) => [...prev, m]);

  const sendUser = (text: string) => {
    addMsg({ id: uid(), role: "user", text });
    setSending(true);
    const thinkingId = uid();
    setMsgs((p) => [...p, { id: thinkingId, role: "thinking" }]);
    window.setTimeout(() => {
      const reply = botReply(text, mentor);
      setMsgs((p) =>
        p
          .filter((x) => x.id !== thinkingId)
          .concat({ id: uid(), role: "bot", text: reply.text, code: reply.code }),
      );
      setSending(false);
    }, 700 + Math.random() * 400);
  };

  const sendCodeResult = (code: string, lang: "javascript" | "python", result: RunResult) => {
    addMsg({
      id: uid(),
      role: "user",
      text: `Ran ${lang === "python" ? "Python" : "JavaScript"}:\n\n${code}`,
    });
    addMsg({
      id: uid(),
      role: "output",
      ok: result.ok,
      output: result.output || "(no output)",
      lang,
    });
  };

  if (!email) return null;

  return (
    <div className="relative flex h-screen min-h-0 flex-col overflow-hidden" style={{ background: "var(--background)" }}>
      <AmbientCanvas intensity={0.35} />

      <header className="z-20 shrink-0 backdrop-blur-md" style={{ background: "color-mix(in oklab, var(--background) 72%, transparent)" }}>
        <div className="hairline">
          <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-6">
            <div className="font-serif text-[22px] tracking-tight">Jargon</div>
            <HeaderMenus
              activeLessonId={lessonId}
              onSelectLesson={(id) => {
                setLessonId(id);
                store.setLessonId(id);
              }}
              mentor={mentor}
              onMentorChange={(m) => {
                setMentor(m);
                store.setMentor(m);
              }}
            />
            <SettingsMenu email={email} />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full min-h-0 max-w-[760px] flex-1 flex-col px-5 pt-10">
        <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pb-[200px]">
          {msgs.map((m) => (
            <MessageRow key={m.id} msg={m} />
          ))}
        </div>
      </main>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-6 pt-6"
      >
        <div className="pointer-events-auto w-full max-w-[760px]">
          <Composer onSendText={sendUser} onSendCodeResult={sendCodeResult} sending={sending} />
        </div>
      </div>
    </div>
  );
}

function MessageRow({ msg }: { msg: Msg }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, []);

  if (msg.role === "user") {
    return (
      <div ref={ref} className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-foreground px-4 py-2.5 text-[14.5px] leading-relaxed text-background">
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.role === "thinking") {
    return (
      <div ref={ref} className="flex">
        <div className="rounded-2xl bg-muted px-4 py-3">
          <span className="shimmer-dot" />
          <span className="shimmer-dot" />
          <span className="shimmer-dot" />
        </div>
      </div>
    );
  }

  if (msg.role === "output") {
    return (
      <div ref={ref} className="flex">
        <div className="w-full">
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            {msg.ok ? "Output" : "Error"} \u00B7 {msg.lang === "python" ? "Python" : "JavaScript"}
          </div>
          <pre
            className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/60 px-4 py-3 text-[12.5px] leading-relaxed text-foreground"
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          >
            {msg.output}
          </pre>
        </div>
      </div>
    );
  }

  // bot
  return (
    <div ref={ref} className="flex">
      <div className="w-full max-w-[92%] space-y-3">
        <div className="text-[15px] leading-relaxed text-foreground">{msg.text}</div>
        {msg.code && (
          <GradientCard>
            <div className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  {msg.code.language === "python" ? "Python" : "JavaScript"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  open the \u2039/\u203A editor below to run
                </span>
              </div>
              <pre
                className="overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed text-foreground"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              >
                {msg.code.source}
              </pre>
            </div>
          </GradientCard>
        )}
      </div>
    </div>
  );
}
