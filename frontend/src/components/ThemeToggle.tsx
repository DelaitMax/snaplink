import { Moon, Sun } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { toggleTheme } from "@/features/theme/themeSlice";

export function ThemeToggle() {
  const theme = useAppSelector((state) => state.theme.value);
  const dispatch = useAppDispatch();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="inline-flex size-9 items-center justify-center rounded-md border border-border-strong bg-surface text-ink-muted transition-colors hover:border-accent-strong hover:text-accent-strong"
      onClick={() => dispatch(toggleTheme())}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
