import { Link } from "react-router-dom";
import { Button } from "@/components/Button";

export function NotFoundPage() {
  return (
    <div className="m-auto flex flex-col items-center gap-4 text-center">
      <h1>404</h1>
      <p className="text-ink-muted">Такой страницы нет.</p>
      <Link to="/">
        <Button variant="secondary">На главную</Button>
      </Link>
    </div>
  );
}
