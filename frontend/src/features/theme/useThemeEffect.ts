import { useEffect } from "react";
import { useAppSelector } from "@/app/hooks";

export function useThemeEffect(): void {
  const theme = useAppSelector((state) => state.theme.value);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
}
