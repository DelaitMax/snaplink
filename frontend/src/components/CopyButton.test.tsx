import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  it("copies the value to the clipboard and shows confirmation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    render(<CopyButton value="https://short.ly/abc" />);
    await userEvent.click(screen.getByRole("button", { name: "Копировать" }));

    expect(writeText).toHaveBeenCalledWith("https://short.ly/abc");
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("Скопировано"));

    vi.unstubAllGlobals();
  });

  it("does not crash if the clipboard API rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    render(<CopyButton value="https://short.ly/abc" />);
    await userEvent.click(screen.getByRole("button", { name: "Копировать" }));

    expect(screen.getByRole("button", { name: "Копировать" })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
