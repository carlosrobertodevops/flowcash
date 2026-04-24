import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card/70 shadow-sm backdrop-blur-xl transition duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:border before:border-sky-400/0 hover:-translate-y-0.5 hover:border-sky-400/55 hover:shadow-glow hover:before:border-sky-300/30",
        className,
      )}
      {...props}
    />
  );
}
