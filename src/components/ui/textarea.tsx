import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-lg border border-border bg-background/55 px-3 py-3 text-sm outline-none backdrop-blur transition placeholder:text-muted-foreground focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20",
        className,
      )}
      {...props}
    />
  );
}
