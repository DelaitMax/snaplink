import { describe, expect, it, vi, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@/testUtils/renderWithProviders";
import { ProtectedRoute } from "./ProtectedRoute";

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
}

function renderProtected(route: string, requireAdmin = false) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Страница входа</div>} />
      <Route path="/my-links" element={<div>Мои ссылки</div>} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={requireAdmin}>
            <div>Секретный дашборд</div>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { route },
  );
}

describe("ProtectedRoute", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to /login when the session check fails (401)", async () => {
    mockFetchOnce(401, { error: { message: "Authentication required" } });
    renderProtected("/admin");

    await waitFor(() => expect(screen.getByText("Страница входа")).toBeInTheDocument());
    expect(screen.queryByText("Секретный дашборд")).not.toBeInTheDocument();
  });

  it("renders children when the session check succeeds", async () => {
    mockFetchOnce(200, { id: 1, email: "admin@example.com", role: "admin" });
    renderProtected("/admin");

    await waitFor(() => expect(screen.getByText("Секретный дашборд")).toBeInTheDocument());
  });

  it("renders admin-only children for an admin when requireAdmin is set", async () => {
    mockFetchOnce(200, { id: 1, email: "admin@example.com", role: "admin" });
    renderProtected("/admin", true);

    await waitFor(() => expect(screen.getByText("Секретный дашборд")).toBeInTheDocument());
  });

  it("redirects a logged-in non-admin away from an admin-only route", async () => {
    mockFetchOnce(200, { id: 2, email: "user@example.com", role: "user" });
    renderProtected("/admin", true);

    await waitFor(() => expect(screen.getByText("Мои ссылки")).toBeInTheDocument());
    expect(screen.queryByText("Секретный дашборд")).not.toBeInTheDocument();
  });
});
