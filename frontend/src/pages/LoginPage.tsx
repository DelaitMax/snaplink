import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/features/auth/authApi";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { getApiErrorMessage } from "@/services/apiError";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location } | null)?.from;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const user = await login({ email, password }).unwrap();
      const fallback = user.role === "admin" ? "/admin" : "/my-links";
      navigate(typeof from === "string" ? from : fallback, { replace: true });
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-[380px]">
        <h1 className="text-2xl">Вход</h1>
        <p className="mt-2 text-sm text-ink-muted">Доступ к дашборду сервиса.</p>

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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error ? <ErrorBanner message={getApiErrorMessage(error, "Неверный email или пароль")} /> : null}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Входим…" : "Войти"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          Впервые здесь?{" "}
          <Link to="/register" className="font-semibold text-accent-strong">
            Зарегистрироваться
          </Link>
        </p>
      </Card>
    </div>
  );
}
