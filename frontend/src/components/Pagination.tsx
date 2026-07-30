import { Button } from "@/components/Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 pt-4">
      <Button variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Назад
      </Button>
      <span className="font-mono text-[13px] text-ink-muted">
        стр. {page} из {totalPages}
      </span>
      <Button variant="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Вперёд →
      </Button>
    </div>
  );
}
