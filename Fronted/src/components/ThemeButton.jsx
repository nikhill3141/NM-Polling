import React from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeButton({ theme, onToggleTheme }) {
  return (
    <button className="icon-btn theme-toggle" onClick={onToggleTheme} aria-label="Toggle dark mode" type="button">
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
