import type { InputHTMLAttributes } from "react";
import { useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const FIELD_LABEL_CLASS = "text-[13px] font-semibold text-ink-muted uppercase tracking-wide";

export const FIELD_INPUT_CLASS =
  "rounded-md border-[1.5px] border-border-strong bg-surface px-3.5 py-3 text-[15px] placeholder:text-ink-faint transition-[border-color,box-shadow] focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)] focus-visible:outline-none";

export function Input({ label, hint, error, id, className, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-2 text-left">
      <label htmlFor={inputId} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <input
        id={inputId}
        className={[FIELD_INPUT_CLASS, error && "border-danger", className].filter(Boolean).join(" ")}
        {...rest}
      />
      {error ? (
        <p className="text-[13px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
