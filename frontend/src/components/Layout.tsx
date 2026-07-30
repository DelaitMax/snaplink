import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useGetCurrentUserQuery, useLogoutMutation } from "@/features/auth/authApi";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Layout({ children }: { children: ReactNode }) {
  const { data: user } = useGetCurrentUserQuery();
  const [logout] = useLogoutMutation();

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 max-[640px]:px-4 max-[640px]:py-3">
        <Link to="/" className="font-sans text-xl font-bold tracking-tight text-ink max-[380px]:text-[17px]">
          short<span className="text-accent">ly</span>
        </Link>
        <nav className="flex items-center gap-4 max-[640px]:gap-2">
          {user ? (
            <>
              <Link
                to={user.role === "admin" ? "/admin" : "/my-links"}
                className="text-sm font-semibold text-ink max-[380px]:text-[13px]"
              >
                {user.role === "admin" ? "Дашборд" : "Мои ссылки"}
              </Link>
              <span className="font-mono text-[13px] text-ink-muted max-[640px]:hidden">{user.email}</span>
              <Button variant="ghost" onClick={() => logout()}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink max-[380px]:text-[13px]">
                Войти
              </Link>
              <Link to="/register" className="text-sm font-semibold text-ink max-[640px]:hidden">
                Регистрация
              </Link>
            </>
          )}
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex flex-1 flex-col px-6 py-12 max-[640px]:px-4 max-[640px]:py-6">{children}</main>
    </div>
  );
}
