import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/testUtils/renderWithProviders";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("toggles the aria-label when clicked", async () => {
    const { store } = renderWithProviders(<ThemeToggle />);

    const initialTheme = store.getState().theme.value;
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      initialTheme === "dark" ? "Включить светлую тему" : "Включить тёмную тему",
    );

    await userEvent.click(button);

    const newTheme = store.getState().theme.value;
    expect(newTheme).not.toBe(initialTheme);
    expect(button).toHaveAttribute(
      "aria-label",
      newTheme === "dark" ? "Включить светлую тему" : "Включить тёмную тему",
    );
  });
});
