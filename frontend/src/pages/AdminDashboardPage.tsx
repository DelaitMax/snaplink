import { useState } from "react";
import { useGetAdminLinksQuery, useGetGlobalStatsQuery, adminClicksExportUrl } from "@/features/admin/adminApi";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { ErrorBanner } from "@/components/ErrorBanner";
import { BarChart } from "@/components/BarChart";
import { DonutChart } from "@/components/DonutChart";
import { Pagination } from "@/components/Pagination";
import { getApiErrorMessage } from "@/services/apiError";

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Десктоп",
  mobile: "Мобильные",
  tablet: "Планшеты",
  other: "Другое",
};

const SECTION_TITLE = "mb-3 text-[13px] font-semibold tracking-wide text-ink-muted uppercase";
const EMPTY_STATE = "py-6 text-center text-ink-faint";
const TABLE_HEAD_CELL =
  "border-b border-border px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-ink-faint uppercase whitespace-nowrap";
const TABLE_CELL = "border-b border-border px-3 py-2";

export function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const statsQuery = useGetGlobalStatsQuery();
  const linksQuery = useGetAdminLinksQuery({ page, pageSize });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>Дашборд</h1>
        <a href={adminClicksExportUrl}>
          <Button variant="secondary">Экспорт всех переходов в CSV</Button>
        </a>
      </div>

      {statsQuery.isLoading ? (
        <Spinner />
      ) : statsQuery.isError || !statsQuery.data ? (
        <ErrorBanner message={getApiErrorMessage(statsQuery.error, "Не удалось загрузить статистику")} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
            <Card>
              <p className="text-[13px] text-ink-muted">Всего ссылок</p>
              <p className="mt-2 font-mono text-4xl font-semibold">{statsQuery.data.totalLinks}</p>
            </Card>
            <Card>
              <p className="text-[13px] text-ink-muted">Всего переходов</p>
              <p className="mt-2 font-mono text-4xl font-semibold">{statsQuery.data.totalClicks}</p>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
            <Card>
              <p className={SECTION_TITLE}>Переходы по дням (30 дней)</p>
              <BarChart data={statsQuery.data.clicksByDay.map((d) => ({ label: d.day.slice(5), value: d.count }))} />
            </Card>
            <Card>
              <p className={SECTION_TITLE}>Устройства</p>
              <BarChart
                data={statsQuery.data.deviceBreakdown.map((d) => ({
                  label: DEVICE_LABELS[d.deviceType] ?? d.deviceType,
                  value: d.count,
                }))}
              />
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
            <Card>
              <p className={SECTION_TITLE}>Браузеры</p>
              <DonutChart
                data={statsQuery.data.browserBreakdown.map((d) => ({
                  label: d.browser ?? "Неизвестно",
                  value: d.count,
                }))}
              />
            </Card>
            <Card>
              <p className={SECTION_TITLE}>Операционные системы</p>
              <DonutChart
                data={statsQuery.data.osBreakdown.map((d) => ({
                  label: d.os ?? "Неизвестно",
                  value: d.count,
                }))}
              />
            </Card>
          </div>

          <Card>
            <p className={SECTION_TITLE}>Топ-ссылки</p>
            {statsQuery.data.topLinks.length === 0 ? (
              <p className={EMPTY_STATE}>Пока нет переходов.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {statsQuery.data.topLinks.map((link) => (
                  <li
                    key={link.shortCode}
                    className="flex items-center gap-3 border-b border-border py-2 text-[13px] last:border-b-0"
                  >
                    <span className="font-mono font-semibold text-accent-strong">{link.shortCode}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-muted">{link.originalUrl}</span>
                    <span className="font-mono font-semibold">{link.clicks}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </>
      )}

      <Card>
        <p className={SECTION_TITLE}>Все ссылки</p>

        {linksQuery.isLoading ? (
          <Spinner />
        ) : linksQuery.isError || !linksQuery.data ? (
          <ErrorBanner message={getApiErrorMessage(linksQuery.error, "Не удалось загрузить список ссылок")} />
        ) : linksQuery.data.items.length === 0 ? (
          <p className={EMPTY_STATE}>Ссылок пока нет.</p>
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
                      <td className={`${TABLE_CELL} font-mono`}>{link.shortCode}</td>
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
