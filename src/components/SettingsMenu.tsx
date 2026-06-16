import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import gsap from "gsap";
import { Settings, User, LogOut } from "lucide-react";
import { GradientCard } from "./GradientCard";
import { store } from "@/lib/jargon-store";

export function SettingsMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { y: -8, opacity: 0, scale: 0.985 },
        { y: 0, opacity: 1, scale: 1, duration: 0.22, ease: "power3.out" },
      );
    }
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </button>
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+10px)] w-[260px]"
        >
          <GradientCard>
            <div className="p-4">
              <div className="flex items-center gap-3 px-1 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-[12px] text-muted-foreground">
                  {email.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-foreground">Signed in</div>
                  <div className="truncate text-[12px] text-muted-foreground">{email}</div>
                </div>
              </div>
              <div className="my-2 h-px bg-border" />
              <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted">
                <User className="h-[15px] w-[15px]" strokeWidth={1.5} /> Profile
              </button>
              <button
                onClick={() => {
                  store.clearUser();
                  navigate({ to: "/login" });
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted"
              >
                <LogOut className="h-[15px] w-[15px]" strokeWidth={1.5} /> Log out
              </button>
            </div>
          </GradientCard>
        </div>
      )}
    </div>
  );
}
