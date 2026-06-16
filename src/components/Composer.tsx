import { Suspense, lazy, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Code2, Send, Play, X } from "lucide-react";
import { GradientCard } from "./GradientCard";
import { runJavaScript, runPython, type RunResult } from "@/lib/code-runner";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((m) => ({ default: m.default })),
);

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
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    gsap.fromTo(
      wrapRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
    );
  }, [mode]);

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
    <div ref={wrapRef} className="w-full">
      <GradientCard>
        <div className="px-4 py-3">
          {mode === "text" ? (
            <div className="flex items-end gap-2">
              <button
                aria-label="Switch to code"
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
                placeholder="Ask anything\u2026 try \u201Cshow me a for loop\u201D"
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
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex rounded-full border border-border p-[2px] text-[11.5px]">
                  {(["javascript", "python"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`rounded-full px-2.5 py-[3px] transition-colors ${
                        lang === l
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {l === "javascript" ? "JS" : "Py"}
                    </button>
                  ))}
                </div>
                <span className="text-[11.5px] text-muted-foreground">
                  {lang === "python"
                    ? running
                      ? "Booting Python\u2026"
                      : "Python runs in your browser via Pyodide."
                    : "JavaScript runs in a sandbox."}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    aria-label="Back to chat"
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
                    theme="vs"
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
