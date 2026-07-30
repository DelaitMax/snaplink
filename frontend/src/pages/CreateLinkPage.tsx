import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCreateLinkMutation } from "@/features/links/linksApi";
import { extractStatsToken } from "@/features/links/extractStatsToken";
import { Button } from "@/components/Button";
import { Input, FIELD_LABEL_CLASS, FIELD_INPUT_CLASS } from "@/components/Input";
import { Card } from "@/components/Card";
import { CopyButton } from "@/components/CopyButton";
import { QrCode } from "@/components/QrCode";
import { ErrorBanner } from "@/components/ErrorBanner";
import { getApiErrorMessage } from "@/services/apiError";

const TTL_OPTIONS = [
  { label: "Бессрочно", value: "" },
  { label: "1 час", value: String(60 * 60) },
  { label: "1 день", value: String(60 * 60 * 24) },
  { label: "7 дней", value: String(60 * 60 * 24 * 7) },
  { label: "30 дней", value: String(60 * 60 * 24 * 30) },
];

export function CreateLinkPage() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState("");
  const [createLink, { data, error, isLoading, reset }] = useCreateLinkMutation();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedAlias = alias.trim();
    createLink({
      url: url.trim(),
      ...(trimmedAlias ? { alias: trimmedAlias } : {}),
      ...(ttlSeconds ? { ttlSeconds: Number(ttlSeconds) } : {}),
    });
  }

  function handleReset() {
    reset();
    setUrl("");
    setAlias("");
    setTtlSeconds("");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-12">
      <section className="flex flex-col gap-3 text-center">
        <h1 className="text-[clamp(28px,5vw,42px)] tracking-tight">
          Длинная ссылка? <span className="text-accent">Сократим.</span>
        </h1>
        <p className="text-base text-ink-muted">Кастомный алиас, срок жизни и статистика переходов — из коробки.</p>
      </section>

      <Card className="w-full">
        {data ? (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs tracking-wide text-success uppercase">Готово</p>
            <div className="flex items-start gap-6 max-[560px]:flex-col-reverse max-[560px]:items-center max-[560px]:text-center">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3 rounded-md bg-accent-soft p-4">
                  <a
                    className="min-w-0 flex-1 font-mono text-[17px] font-semibold break-words text-accent-ink no-underline"
                    href={data.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {data.shareUrl}
                  </a>
                  <CopyButton value={data.shareUrl} />
                </div>
                <p className="text-sm break-words text-ink-muted">→ {data.originalUrl}</p>

                <div className="flex flex-wrap gap-3 pt-2 max-[560px]:justify-center">
                  <Link to={`/s/${extractStatsToken(data.statsUrl)}`}>
                    <Button variant="secondary">Смотреть статистику</Button>
                  </Link>
                  <Button variant="ghost" onClick={handleReset}>
                    Сократить ещё одну
                  </Button>
                </div>
              </div>
              <QrCode value={data.shareUrl} />
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <Input
              label="Ссылка"
              type="text"
              placeholder="https://example.com/очень/длинный/путь"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoFocus
            />

            <div className="grid grid-cols-[1fr_180px] gap-4 max-[560px]:grid-cols-1">
              <Input
                label="Кастомный алиас (необязательно)"
                placeholder="my-link"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                hint="3–32 символа: латиница, цифры, - и _"
              />

              <div className="flex flex-col gap-2 text-left">
                <label className={FIELD_LABEL_CLASS} htmlFor="ttl">
                  Срок жизни
                </label>
                <select
                  id="ttl"
                  className={FIELD_INPUT_CLASS}
                  value={ttlSeconds}
                  onChange={(e) => setTtlSeconds(e.target.value)}
                >
                  {TTL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? <ErrorBanner message={getApiErrorMessage(error, "Не удалось создать ссылку")} /> : null}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Сокращаем…" : "Сократить ссылку"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
