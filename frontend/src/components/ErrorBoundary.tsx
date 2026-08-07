import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled error in component tree:", error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.assign("/");
  };

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="m-auto flex flex-col items-center gap-4 text-center">
          <h1>Что-то пошло не так</h1>
          <p className="text-ink-muted">Произошла непредвиденная ошибка. Попробуйте вернуться на главную страницу.</p>
          <Button variant="secondary" onClick={this.handleReload}>
            На главную
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
