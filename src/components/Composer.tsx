import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Code2, Send, Play, X } from "lucide-react";
import { GradientCard } from "./GradientCard";
import { runJavaScript, runPython, type RunResult } from "@/lib/code-runner";
import { useTheme } from "@/lib/theme";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((m) => ({ default: m.default })),
);

const JARGON_LIGHT_THEME = "jargon-light";
const JARGON_DARK_THEME = "jargon-dark";

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

type Mode = "text" | "code";
type Lang = "javascript" | "python";

export function Composer({
  onSendText,
  onSendCodeResult,
  sending,
}: {
  onSendText: (text: string) => void;
  onSendCodeResult: (code: string, lang: Lang, result: RunResult) => void;
  sending: boolean;
}) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [lang, setLang] = useState<Lang>("javascript");
  const [code, setCode] = useState<string>(
    `// Try me. Hit Run \u25B6 to see output in the chat.\nconsole.log("hello from jargon");`,
  );
  const [running, setRunning] = useState(false);
  const morphRef = useRef<HTMLDivElement>(null);
  const textPanelRef = useRef<HTMLDivElement>(null);
  const codePanelRef = useRef<HTMLDivElement>(null);
  const { resolved } = useTheme();
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  const toHex = (input: string, fallback: string) => {
    try {
      const c = document.createElement("canvas").getContext("2d");
      if (!c) return fallback;
      c.fillStyle = "#000";
      c.fillStyle = input;
      const v = c.fillStyle as string;
      if (typeof v === "string" && v.startsWith("#")) return v;
    } catch {
      /* noop */
    }
    return fallback;
  };

  const applyMonacoTheme = (monaco: typeof import("monaco-editor")) => {
    const bg = toHex(readVar("--surface", "#0b0b0d"), "#0b0b0d");
    const fg = toHex(readVar("--foreground", "#e6e6ea"), "#e6e6ea");
    const muted = toHex(readVar("--muted-foreground", "#8a8a90"), "#8a8a90");
    const accent = toHex(readVar("--accent", "#7c5cff"), "#7c5cff");
    const isDark = document.documentElement.classList.contains("dark");
    monaco.editor.defineTheme(JARGON_DARK_THEME, {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: muted.slice(1), fontStyle: "italic" },
        { token: "keyword", foreground: accent.slice(1) },
        { token: "string", foreground: "8ad0a8" },
        { token: "number", foreground: "f0a868" },
      ],
      colors: {
        "editor.background": bg,
        "editor.foreground": fg,
        "editorLineNumber.foreground": muted,
        "editorCursor.foreground": fg,
        "editor.selectionBackground": "#ffffff20",
        "editor.inactiveSelectionBackground": "#ffffff14",
      },
    });
    monaco.editor.defineTheme(JARGON_LIGHT_THEME, {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: muted.slice(1), fontStyle: "italic" },
        { token: "keyword", foreground: accent.slice(1) },
      ],
      colors: {
        "editor.background": bg,
        "editor.foreground": fg,
        "editorLineNumber.foreground": muted,
        "editorCursor.foreground": fg,
      },
    });
    monaco.editor.setTheme(isDark ? JARGON_DARK_THEME : JARGON_LIGHT_THEME);
  };

  const handleMonacoMount = (_editor: unknown, monaco: typeof import("monaco-editor")) => {
    monacoRef.current = monaco;
    applyMonacoTheme(monaco);
  };

  useEffect(() => {
    if (monacoRef.current) applyMonacoTheme(monacoRef.current);
  }, [resolved]);

  // smooth height morph between text & code panels
  useLayoutEffect(() => {
    const wrap = morphRef.current;
    const target = (mode === "text" ? textPanelRef.current : codePanelRef.current);
    if (!wrap || !target) return;
    const fromH = wrap.offsetHeight;
    const toH = target.scrollHeight;
    gsap.fromTo(
      wrap,
      { height: fromH },
      {
        height: toH,
        duration: 0.36,
        ease: "power3.out",
        onComplete: () => {
          requestAnimationFrame(() => {
            if (morphRef.current) morphRef.current.style.height = "auto";
          });
        },
      },
    );
    gsap.fromTo(
      target,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", delay: 0.06 },
    );
  }, [mode, lang]);

  const send = () => {
    const t = text.trim();
    if (!t || sending) return;
    onSendText(t);
    setText("");
  };

  const run = async () => {
    setRunning(true);
    const result = lang === "python" ? await runPython(code) : await runJavaScript(code);
    setRunning(false);
    onSendCodeResult(code, lang, result);
  };

  return (
    <div className="w-full">
      <GradientCard>
        <div ref={morphRef} className="overflow-hidden px-4 py-3">
          {mode === "text" ? (
            <div ref={textPanelRef} className="flex items-end gap-2">
              <button
                aria-label="Open code editor"
                onClick={() => setMode("code")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Code2 className="h-[16px] w-[16px]" strokeWidth={1.5} />
              </button>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={"Ask anything\u2026 try \u201Cshow me a for loop\u201D"}
                className="max-h-[160px] min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[14.5px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                aria-label="Send"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-30"
              >
                <Send className="h-[14px] w-[14px]" strokeWidth={1.8} />
              </button>
            </div>
          ) : (
            <div ref={codePanelRef}>
              <div className="mb-2 flex items-center gap-2">
                <LangToggle lang={lang} onChange={setLang} />
                <span className="text-[11.5px] text-muted-foreground">
                  {lang === "python"
                    ? running
                      ? "Booting Python\u2026"
                      : "Python runs in your browser via Pyodide."
                    : "JavaScript runs in a sandbox."}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    aria-label="Close editor"
                    onClick={() => setMode("text")}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-[14px] w-[14px]" strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={run}
                    disabled={running}
                    className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[12px] font-medium text-background transition-opacity disabled:opacity-50"
                  >
                    {running ? (
                      <>
                        <span className="shimmer-dot" />
                        <span className="shimmer-dot" />
                        <span className="shimmer-dot" />
                      </>
                    ) : (
                      <>
                        <Play className="h-[12px] w-[12px]" strokeWidth={2} /> Run
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
                <Suspense
                  fallback={
                    <div className="px-3 py-6 text-[12px] text-muted-foreground">
                      Loading editor\u2026
                    </div>
                  }
                >
                  <MonacoEditor
                    height="220px"
                    language={lang}
                    value={code}
                    onChange={(v) => setCode(v ?? "")}
                    theme={resolved === "dark" ? JARGON_DARK_THEME : JARGON_LIGHT_THEME}
                    onMount={handleMonacoMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                      lineNumbers: "off",
                      scrollBeyondLastLine: false,
                      padding: { top: 12, bottom: 12 },
                      renderLineHighlight: "none",
                      overviewRulerLanes: 0,
                      scrollbar: { vertical: "hidden", horizontal: "hidden" },
                    }}
                  />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </GradientCard>
    </div>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const langs: Lang[] = ["javascript", "python"];
  const rowRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const idx = langs.indexOf(lang);
    const btn = btnRefs.current[idx];
    if (!btn) return;
    gsap.to(pill, {
      x: btn.offsetLeft,
      width: btn.offsetWidth,
      duration: 0.32,
      ease: "power3.out",
    });
  }, [lang]);

  return (
    <div
      ref={rowRef}
      className="relative flex rounded-full border border-border p-[2px] text-[11.5px]"
    >
      <div
        ref={pillRef}
        aria-hidden
        className="absolute left-0 top-[2px] h-[calc(100%-4px)] rounded-full bg-foreground"
        style={{ width: 0 }}
      />
      {langs.map((l, i) => {
        const active = lang === l;
        return (
          <button
            key={l}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            onClick={() => onChange(l)}
            className={`relative z-10 rounded-full px-2.5 py-[3px] transition-colors ${
              active ? "text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l === "javascript" ? "JS" : "Py"}
          </button>
        );
      })}
    </div>
  );
}
