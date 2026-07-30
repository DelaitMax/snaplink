import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("disables 'Назад' on the first page and 'Вперёд' on the last", () => {
    render(<Pagination page={1} totalPages={3} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Назад/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Вперёд/ })).toBeEnabled();
  });

  it("calls onChange with page + 1 / page - 1", async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /Вперёд/ }));
    expect(onChange).toHaveBeenCalledWith(3);

    await userEvent.click(screen.getByRole("button", { name: /Назад/ }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("shows the current page and total", () => {
    render(<Pagination page={2} totalPages={5} onChange={vi.fn()} />);
    expect(screen.getByText("стр. 2 из 5")).toBeInTheDocument();
  });
});
