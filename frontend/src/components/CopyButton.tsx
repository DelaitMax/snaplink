import { useState } from "react";
import { Button } from "@/components/Button";

export function CopyButton({ value, label = "Копировать" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Буфер обмена недоступен (напр. небезопасный контекст без HTTPS) —
      // молча игнорируем, ссылка всё равно видна и выделяема вручную.
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={handleCopy}>
      {copied ? "Скопировано ✓" : label}
    </Button>
  );
}
