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
  const [activeColor, setActiveColor] = useState("amber");
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load saved color theme
    const savedColor = localStorage.getItem("theme-color");
    if (savedColor) {
      setActiveColor(savedColor);
      applyColorTheme(savedColor);
    }

    // Load saved mode (dark/light)
    const savedMode = localStorage.getItem("theme-mode");
    if (savedMode) {
      const dark = savedMode === "dark";
      setIsDark(dark);
      applyMode(dark);
    }
  }, []);

  const applyColorTheme = (themeName: string) => {
    const theme = themes.find((t) => t.name === themeName);
    if (theme) {
      document.documentElement.style.setProperty("--accent", theme.color);
      document.documentElement.style.setProperty("--accent-hover", theme.hover);
    }
  };

  const applyMode = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  };

  const handleColorChange = (themeName: string) => {
    setActiveColor(themeName);
    applyColorTheme(themeName);
    localStorage.setItem("theme-color", themeName);
  };

  const handleModeToggle = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    applyMode(newMode);
    localStorage.setItem("theme-mode", newMode ? "dark" : "light");
  };

  if (!mounted) {
    return <div className="flex items-center gap-3 h-6" />;
  }

  return (
    <div className="flex items-center gap-3">
      {/* Color picker */}
      <div className="flex items-center gap-1.5">
        {themes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => handleColorChange(theme.name)}
            className={`h-4 w-4 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
              activeColor === theme.name
                ? "ring-2 ring-foreground/50 ring-offset-1 ring-offset-background"
                : ""
            }`}
            style={{ backgroundColor: theme.color }}
            aria-label={`Switch to ${theme.name} theme`}
            title={theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Light/Dark toggle */}
      <button
        onClick={handleModeToggle}
        className="p-1 rounded-md text-muted hover:text-foreground hover:bg-card transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light mode" : "Dark mode"}
      >
        {isDark ? (
          // Sun icon
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          // Moon icon
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
