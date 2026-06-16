import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Eye, EyeOff } from "lucide-react";
import { AmbientCanvas } from "@/components/AmbientCanvas";
import { GradientCard } from "@/components/GradientCard";
import { store } from "@/lib/jargon-store";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Jargon" },
      { name: "description", content: "Sign in to Jargon." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-anim='word']", {
        y: 18,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.06,
      });
      gsap.from("[data-anim='pill']", { y: 8, opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.05 });
      gsap.from("[data-anim='card']", { y: 18, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.25 });
      gsap.from("[data-anim='sub']", { y: 10, opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.4 });
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim() || "learner@jargon.app";
    gsap.to(wrapRef.current, {
      opacity: 0,
      y: -8,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        store.setUser(value);
        navigate({ to: "/chat" });
      },
    });
  };

  const headline = "Learn anything,\nin your own words.".split(" ");

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <AmbientCanvas intensity={0.85} />
      <ThemeToggle floating />
      <div
        ref={wrapRef}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16"
      >
        <GradientCard pill data-anim="pill">
          <div className="px-4 py-1.5 text-[13px] leading-none">
            <span className="grad-text font-medium tracking-tight">Jargon AI tutor</span>
          </div>
        </GradientCard>

        <h1 className="font-serif mt-7 max-w-[820px] text-center text-[44px] leading-[1.05] tracking-tight text-foreground sm:text-[64px]">
          {headline.map((w, i) => (
            <span key={i} data-anim="word" className="inline-block">
              {w}
              {i < headline.length - 1 ? "\u00A0" : ""}
            </span>
          ))}
        </h1>

        <p data-anim="sub" className="mt-5 max-w-md text-center text-[15px] leading-relaxed text-muted-foreground">
          Hyper-personal lessons that meet you where you are. One conversation at a time.
        </p>

        <div data-anim="card" className="mt-12 w-full max-w-[400px]">
          <GradientCard>
            <form onSubmit={onSubmit} className="space-y-5 p-7">
              <div>
                <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@somewhere.com"
                  className="mt-1.5 w-full border-b border-border bg-transparent py-2 text-[15px] outline-none placeholder:text-muted-foreground/60 focus:border-foreground transition-colors"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  className="mt-1.5 w-full border-b border-border bg-transparent py-2 text-[15px] outline-none placeholder:text-muted-foreground/60 focus:border-foreground transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-foreground py-3 text-[14px] font-medium text-background transition-transform hover:-translate-y-[1px] active:translate-y-0"
              >
                Continue
              </button>
            </form>
          </GradientCard>
        </div>
      </div>
    </div>
  );
}
