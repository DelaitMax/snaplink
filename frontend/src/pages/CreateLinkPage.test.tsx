import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/testUtils/renderWithProviders";
import { CreateLinkPage } from "./CreateLinkPage";

function mockFetchResponse(status: number, body: unknown) {
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

describe("CreateLinkPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits the form and shows the created link", async () => {
    mockFetchResponse(201, {
      shortCode: "abc1234",
      shareUrl: "http://localhost:3000/abc1234",
      statsUrl: "http://localhost:3000/api/links/statstoken123/stats",
      originalUrl: "https://example.com/page",
      expiresAt: null,
      createdAt: new Date().toISOString(),
    });

    renderWithProviders(<CreateLinkPage />);

    await userEvent.type(screen.getByLabelText("Ссылка"), "https://example.com/page");
    await userEvent.click(screen.getByRole("button", { name: "Сократить ссылку" }));

    await waitFor(() => expect(screen.getByText("http://localhost:3000/abc1234")).toBeInTheDocument());
    expect(screen.getByText("→ https://example.com/page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Смотреть статистику" })).toHaveAttribute("href", "/s/statstoken123");

    const call = vi.mocked(fetch).mock.calls[0];
    if (!call) throw new Error("Expected fetch to have been called");
    const [request] = call;
    const sentBody = await (request as Request).text();
    expect(JSON.parse(sentBody)).toMatchObject({ url: "https://example.com/page" });
  });

  it("shows an error message when creation fails", async () => {
    mockFetchResponse(400, { error: { message: "URL points to a blocked host", code: "INVALID_URL" } });

    renderWithProviders(<CreateLinkPage />);

    await userEvent.type(screen.getByLabelText("Ссылка"), "http://localhost:9999/secret");
    await userEvent.click(screen.getByRole("button", { name: "Сократить ссылку" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("URL points to a blocked host"));
  });

  it("lets the user reset the form after a successful creation", async () => {
    mockFetchResponse(201, {
      shortCode: "abc1234",
      shareUrl: "http://localhost:3000/abc1234",
      statsUrl: "http://localhost:3000/api/links/statstoken123/stats",
      originalUrl: "https://example.com/page",
      expiresAt: null,
      createdAt: new Date().toISOString(),
    });

    renderWithProviders(<CreateLinkPage />);
    await userEvent.type(screen.getByLabelText("Ссылка"), "https://example.com/page");
    await userEvent.click(screen.getByRole("button", { name: "Сократить ссылку" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Сократить ещё одну" })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Сократить ещё одну" }));

    expect(screen.getByLabelText("Ссылка")).toHaveValue("");
  });
});
