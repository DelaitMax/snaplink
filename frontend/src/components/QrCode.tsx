import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 168 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#14171f", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) return null;

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md border border-border bg-surface p-2"
      style={{ width: size, height: size }}
    >
      {dataUrl ? (
        <img src={dataUrl} alt={`QR-код для ${value}`} width={size} height={size} className="block rounded" />
      ) : null}
    </div>
  );
}
