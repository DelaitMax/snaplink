import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useDeactivateLinkMutation,
  useGetLinkClicksQuery,
  useGetLinkStatsQuery,
  linkClicksExportUrl,
} from "@/features/links/linksApi";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { ErrorBanner } from "@/components/ErrorBanner";
import { BarChart } from "@/components/BarChart";
import { DonutChart } from "@/components/DonutChart";
import { QrCode } from "@/components/QrCode";
import { Pagination } from "@/components/Pagination";
import { getApiErrorMessage } from "@/services/apiError";

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Десктоп",
  mobile: "Мобильные",
  tablet: "Планшеты",
  other: "Другое",
};

const SECTION_TITLE = "text-[13px] font-semibold tracking-wide text-ink-muted uppercase";
const TABLE_HEAD_CELL =
  "border-b border-border px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-ink-faint uppercase whitespace-nowrap";
const TABLE_CELL = "border-b border-border px-3 py-2 whitespace-nowrap";

export function LinkStatsPage() {
  const { statsToken = "" } = useParams<{ statsToken: string }>();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const statsQuery = useGetLinkStatsQuery(statsToken, { skip: !statsToken });
  const clicksQuery = useGetLinkClicksQuery({ statsToken, page, pageSize }, { skip: !statsToken });
  const [deactivate, deactivateState] = useDeactivateLinkMutation();

  if (statsQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (statsQuery.isError || !statsQuery.data) {
    return <ErrorBanner message={getApiErrorMessage(statsQuery.error, "Ссылка не найдена")} />;
  }

  const link = statsQuery.data;
  const clicksByDayData = link.stats.clicksByDay.map((d) => ({
    label: d.day.slice(5),
    value: d.count,
  }));
  const deviceData = link.stats.deviceBreakdown.map((d) => ({
    label: DEVICE_LABELS[d.deviceType] ?? d.deviceType,
    value: d.count,
  }));
  const browserData = link.stats.browserBreakdown.map((d) => ({
    label: d.browser ?? "Неизвестно",
    value: d.count,
  }));
  const osData = link.stats.osBreakdown.map((d) => ({
    label: d.os ?? "Неизвестно",
    value: d.count,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 max-[480px]:flex-col-reverse">
          <div>
            <a
              className="font-mono text-lg font-semibold text-ink no-underline"
              href={link.shareUrl}
              target="_blank"
              rel="noreferrer"
            >
              {link.shareUrl}
            </a>
            <p className="mt-1 text-sm break-words text-ink-muted">→ {link.originalUrl}</p>
          </div>
          <div className="flex flex-col items-end gap-3 max-[480px]:w-full max-[480px]:flex-row-reverse max-[480px]:items-start max-[480px]:justify-end">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                link.isActive ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
              }`}
            >
              {link.isActive ? "Активна" : "Неактивна"}
            </span>
            <QrCode value={link.shareUrl} size={96} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-[13px] text-ink-faint">
          <span>Создана: {new Date(link.createdAt).toLocaleString("ru-RU")}</span>
          {link.expiresAt ? <span>Истекает: {new Date(link.expiresAt).toLocaleString("ru-RU")}</span> : null}
          {link.isCustomAlias ? <span>Кастомный алиас</span> : null}
        </div>

        {link.isActive ? (
          <div className="mt-5 flex flex-col items-start gap-3 border-t border-border pt-4">
            {deactivateState.error ? (
              <ErrorBanner message={getApiErrorMessage(deactivateState.error, "Не удалось деактивировать ссылку")} />
            ) : null}
            <Button variant="danger" onClick={() => deactivate(statsToken)} disabled={deactivateState.isLoading}>
              {deactivateState.isLoading ? "Деактивируем…" : "Деактивировать ссылку"}
            </Button>
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-[200px_1fr_1fr] gap-4 max-[720px]:grid-cols-1">
        <Card>
          <p className="text-[13px] text-ink-muted">Всего переходов</p>
          <p className="mt-2 font-mono text-4xl font-semibold">{link.stats.totalClicks}</p>
        </Card>

        <Card>
          <p className={SECTION_TITLE}>Переходы по дням (30 дней)</p>
          <BarChart data={clicksByDayData} />
        </Card>

        <Card>
          <p className={SECTION_TITLE}>Устройства</p>
          <BarChart data={deviceData} emptyLabel="Пока нет переходов" />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
        <Card>
          <p className={SECTION_TITLE}>Браузеры</p>
          <DonutChart data={browserData} emptyLabel="Пока нет переходов" />
        </Card>

        <Card>
          <p className={SECTION_TITLE}>Операционные системы</p>
          <DonutChart data={osData} emptyLabel="Пока нет переходов" />
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className={SECTION_TITLE}>История переходов</p>
          <a href={linkClicksExportUrl(statsToken)}>
            <Button variant="secondary" type="button">
              Экспорт в CSV
            </Button>
          </a>
        </div>

        {clicksQuery.isLoading ? (
          <Spinner />
        ) : clicksQuery.data && clicksQuery.data.items.length > 0 ? (
          <>
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className={TABLE_HEAD_CELL}>Дата</th>
                    <th className={TABLE_HEAD_CELL}>Гео</th>
                    <th className={TABLE_HEAD_CELL}>Браузер</th>
                    <th className={TABLE_HEAD_CELL}>ОС</th>
                    <th className={TABLE_HEAD_CELL}>Устройство</th>
                  </tr>
                </thead>
                <tbody>
                  {clicksQuery.data.items.map((click, i) => (
                    <tr key={i}>
                      <td className={`${TABLE_CELL} font-mono`}>{new Date(click.clickedAt).toLocaleString("ru-RU")}</td>
                      <td className={TABLE_CELL}>
                        {[click.city, click.region, click.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className={TABLE_CELL}>
                        {click.browser ?? "—"} {click.browserVersion}
                      </td>
                      <td className={TABLE_CELL}>
                        {click.os ?? "—"} {click.osVersion}
                      </td>
                      <td className={TABLE_CELL}>{DEVICE_LABELS[click.deviceType] ?? click.deviceType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={clicksQuery.data.totalPages} onChange={setPage} />
          </>
        ) : (
          <p className="py-6 text-center text-ink-faint">Переходов пока не было.</p>
        )}
      </Card>
    </div>
  );
}
