"use client";

import { useEffect, useState } from "react";

const themes = [
  { name: "amber", color: "#f59e0b", hover: "#fbbf24" },
  { name: "blue", color: "#3b82f6", hover: "#60a5fa" },
  { name: "pink", color: "#ec4899", hover: "#f472b6" },
  { name: "green", color: "#22c55e", hover: "#4ade80" },
  { name: "purple", color: "#a855f7", hover: "#c084fc" },
];

export function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState("amber");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme-color");
    if (saved) {
      setActiveTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (themeName: string) => {
    const theme = themes.find((t) => t.name === themeName);
    if (theme) {
      document.documentElement.style.setProperty("--accent", theme.color);
      document.documentElement.style.setProperty("--accent-hover", theme.hover);
    }
  };

  const handleThemeChange = (themeName: string) => {
    setActiveTheme(themeName);
    applyTheme(themeName);
    localStorage.setItem("theme-color", themeName);
  };

  if (!mounted) {
    return <div className="flex items-center gap-1.5 h-6" />;
  }

  return (
    <div className="flex items-center gap-1.5">
      {themes.map((theme) => (
        <button
          key={theme.name}
          onClick={() => handleThemeChange(theme.name)}
          className={`h-4 w-4 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
            activeTheme === theme.name
              ? "ring-2 ring-white ring-offset-1 ring-offset-background"
              : ""
          }`}
          style={{ backgroundColor: theme.color }}
          aria-label={`Switch to ${theme.name} theme`}
          title={theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
        />
      ))}
    </div>
  );
}
