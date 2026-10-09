import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset["theme"] = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0A0A0F" : "#F7F7FA");
}

export function ThemeToggle() {
  const { lang } = useLang();
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const active = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(active);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = lang === "bn"
    ? nextTheme === "light" ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"
    : `Switch to ${nextTheme} mode`;

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="theme-toggle shrink-0"
      aria-label={label}
      title={label}
      onClick={() => {
        applyTheme(nextTheme);
        localStorage.setItem("terrabangla-theme", nextTheme);
        setTheme(nextTheme);
      }}
    >
      {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}