import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BarChart } from "./BarChart";

describe("BarChart", () => {
  it("shows the empty state when data is empty", () => {
    render(<BarChart data={[]} />);
    expect(screen.getByText("Нет данных за этот период")).toBeInTheDocument();
  });

  it("shows the empty state when all values are zero", () => {
    render(<BarChart data={[{ label: "01-01", value: 0 }]} />);
    expect(screen.getByText("Нет данных за этот период")).toBeInTheDocument();
  });

  it("respects a custom empty label", () => {
    render(<BarChart data={[]} emptyLabel="Ничего нет" />);
    expect(screen.getByText("Ничего нет")).toBeInTheDocument();
  });

  it("renders a column per datum with its value and label", () => {
    render(
      <BarChart
        data={[
          { label: "01-01", value: 3 },
          { label: "01-02", value: 7 },
        ]}
      />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("01-01")).toBeInTheDocument();
    expect(screen.getByText("01-02")).toBeInTheDocument();
  });
});
