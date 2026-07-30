import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetMyLinksQuery } from "@/features/links/linksApi";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Pagination } from "@/components/Pagination";
import { getApiErrorMessage } from "@/services/apiError";

const EMPTY_STATE = "py-6 text-center text-ink-faint";
const TABLE_HEAD_CELL =
  "border-b border-border px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-ink-faint uppercase whitespace-nowrap";
const TABLE_CELL = "border-b border-border px-3 py-2";

export function MyLinksPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const linksQuery = useGetMyLinksQuery({ page, pageSize });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1>Мои ссылки</h1>
          <p className="mt-1 text-sm text-ink-muted">Ссылки, созданные под вашим аккаунтом.</p>
        </div>
        <Link to="/">
          <Button variant="secondary">Создать ссылку</Button>
        </Link>
      </div>

      <Card>
        {linksQuery.isLoading ? (
          <Spinner />
        ) : linksQuery.isError || !linksQuery.data ? (
          <ErrorBanner message={getApiErrorMessage(linksQuery.error, "Не удалось загрузить список ссылок")} />
        ) : linksQuery.data.items.length === 0 ? (
          <p className={EMPTY_STATE}>
            Пока нет ни одной ссылки.{" "}
            <Link to="/" className="font-semibold text-accent-strong">
              Создать первую
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className={TABLE_HEAD_CELL}>Код</th>
                    <th className={TABLE_HEAD_CELL}>Ссылка</th>
                    <th className={TABLE_HEAD_CELL}>Статус</th>
                    <th className={TABLE_HEAD_CELL}>Переходы</th>
                    <th className={TABLE_HEAD_CELL}>Создана</th>
                  </tr>
                </thead>
                <tbody>
                  {linksQuery.data.items.map((link) => (
                    <tr key={link.id}>
                      <td className={`${TABLE_CELL} font-mono`}>
                        <Link to={`/s/${link.statsToken}`} className="font-semibold text-accent-strong">
                          {link.shortCode}
                        </Link>
                      </td>
                      <td className={`${TABLE_CELL} max-w-80 truncate`}>{link.originalUrl}</td>
                      <td className={TABLE_CELL}>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
                            link.isActive ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                          }`}
                        >
                          {link.isActive ? "активна" : "неактивна"}
                        </span>
                      </td>
                      <td className={`${TABLE_CELL} font-mono`}>{link.clicks}</td>
                      <td className={`${TABLE_CELL} font-mono`}>
                        {new Date(link.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={linksQuery.data.totalPages} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
