import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "icon" && "h-10 w-10",
        variant === "primary" &&
          "bg-sky-500 text-white shadow-glow hover:bg-sky-400 hover:shadow-[0_0_38px_rgba(56,189,248,.36)]",
        variant === "secondary" &&
          "border border-border bg-card/70 text-foreground backdrop-blur hover:border-sky-400/70 hover:text-sky-500",
        variant === "ghost" && "text-muted-foreground hover:bg-sky-500/10 hover:text-foreground",
        variant === "danger" &&
          "bg-rose-500 text-white hover:bg-rose-400 hover:shadow-[0_0_28px_rgba(244,63,94,.25)]",
        className,
      )}
      {...props}
    />
  );
}
