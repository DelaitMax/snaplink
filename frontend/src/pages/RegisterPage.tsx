import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "@/features/auth/authApi";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { getApiErrorMessage } from "@/services/apiError";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, { isLoading, error }] = useRegisterMutation();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await register({ email, password }).unwrap();
      navigate("/my-links", { replace: true });
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-[380px]">
        <h1 className="text-2xl">Регистрация</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Заведите аккаунт, чтобы видеть свои ссылки отдельно от чужих. Ссылку без аккаунта тоже можно создать — доступ
          к её статистике останется по секретной ссылке, как и раньше.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Пароль"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          {error ? <ErrorBanner message={getApiErrorMessage(error, "Не удалось зарегистрироваться")} /> : null}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Регистрируем…" : "Зарегистрироваться"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-semibold text-accent-strong">
            Войти
          </Link>
        </p>
      </Card>
    </div>
  );
}
