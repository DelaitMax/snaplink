import type { ReactNode } from "react";

const BASE = "rounded-lg border border-border bg-surface p-8 shadow-sm max-[480px]:rounded-md max-[480px]:p-4";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[BASE, className].filter(Boolean).join(" ")}>{children}</div>;
}
