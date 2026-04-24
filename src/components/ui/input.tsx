import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-background/55 px-3 text-sm outline-none backdrop-blur transition placeholder:text-muted-foreground focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20",
        className,
      )}
      {...props}
    />
  );
}
