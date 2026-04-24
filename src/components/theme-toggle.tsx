"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("flowcash-theme") as "light" | "dark" | null;
    const nextTheme = stored ?? "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("flowcash-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  return (
    <Button aria-label="Alternar tema" size="icon" variant="secondary" onClick={toggleTheme}>
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
