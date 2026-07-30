import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DonutChart } from "./DonutChart";

describe("DonutChart", () => {
  it("shows the empty state when data is empty", () => {
    render(<DonutChart data={[]} />);
    expect(screen.getByText("Нет данных за этот период")).toBeInTheDocument();
  });

  it("shows the empty state when all values are zero", () => {
    render(<DonutChart data={[{ label: "Chrome", value: 0 }]} />);
    expect(screen.getByText("Нет данных за этот период")).toBeInTheDocument();
  });

  it("respects a custom empty label", () => {
    render(<DonutChart data={[]} emptyLabel="Ничего нет" />);
    expect(screen.getByText("Ничего нет")).toBeInTheDocument();
  });

  it("renders a legend entry per datum with its label and value", () => {
    render(
      <DonutChart
        data={[
          { label: "Chrome", value: 7 },
          { label: "Firefox", value: 3 },
        ]}
      />,
    );
    expect(screen.getByText("Chrome")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Firefox")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
