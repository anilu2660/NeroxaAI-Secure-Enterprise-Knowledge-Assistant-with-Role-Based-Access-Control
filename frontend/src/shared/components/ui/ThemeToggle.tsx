import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./button";

function getActiveTheme(): "dark" | "sunny" {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("neroxa_theme");
  if (saved === "sunny" || saved === "light") return "sunny";
  return "dark";
}

export function useTheme() {
  const [theme, setThemeState] = useState<"dark" | "sunny">(getActiveTheme);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEv = e as CustomEvent<{ theme: "dark" | "sunny" }>;
      if (customEv.detail?.theme) {
        setThemeState(customEv.detail.theme);
      }
    };
    window.addEventListener("neroxa:theme_changed", handleThemeChange);
    return () => window.removeEventListener("neroxa:theme_changed", handleThemeChange);
  }, []);

  const setTheme = (newTheme: "dark" | "sunny") => {
    const root = document.documentElement;
    if (newTheme === "sunny") {
      root.classList.remove("dark");
      root.classList.add("sunny");
      localStorage.setItem("neroxa_theme", "sunny");
    } else {
      root.classList.remove("sunny");
      root.classList.add("dark");
      localStorage.setItem("neroxa_theme", "dark");
    }
    setThemeState(newTheme);
    window.dispatchEvent(new CustomEvent("neroxa:theme_changed", { detail: { theme: newTheme } }));
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "sunny" : "dark";
    setTheme(next);
  };

  return { theme, isSunny: theme === "sunny", toggleTheme, setTheme };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, isSunny, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={isSunny ? "Switch to Dark Mode (Obsidian)" : "Switch to Sunny Theme (Daylight)"}
      aria-label={isSunny ? "Switch to Dark Mode" : "Switch to Sunny Theme"}
      className={`relative size-8.5 rounded-xl border border-hairline/70 bg-secondary/30 text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-card shadow-xs group ${
        isSunny ? "hover:text-amber-500 border-amber-500/30 bg-amber-500/10 text-amber-500" : "hover:text-primary"
      } ${className ?? ""}`}
    >
      <div className="relative size-4 flex items-center justify-center">
        {/* Sun icon for Sunny mode */}
        <Sun
          className={`size-4 transition-all duration-300 ${
            isSunny
              ? "rotate-0 scale-100 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
        {/* Moon icon for Dark mode */}
        <Moon
          className={`size-4 transition-all duration-300 ${
            !isSunny
              ? "rotate-0 scale-100 text-muted-foreground group-hover:text-primary"
              : "rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
      </div>
    </Button>
  );
}
