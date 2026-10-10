import { Moon, Sun } from "lucide-react";
import { useState } from "react";

export function useThemeMode() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("tgm-theme") === "dark");
  function toggleTheme() {
    setDarkMode(current => {
      localStorage.setItem("tgm-theme", current ? "light" : "dark");
      return !current;
    });
  }
  return [darkMode, toggleTheme];
}

export function ThemeModeButton({ darkMode, onToggle }) {
  const label = darkMode ? "Switch to light mode" : "Switch to dark mode";
  const Icon = darkMode ? Sun : Moon;
  return <button type="button" className="color-mode-toggle" onClick={onToggle} aria-label={label} aria-pressed={darkMode} title={label}>
    <Icon size={18} strokeWidth={2.2}/><span>{darkMode ? "Light mode" : "Dark mode"}</span>
  </button>;
}
