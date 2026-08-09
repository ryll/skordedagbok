import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DashboardPeriodFilters from "@/components/dashboard-period-filters";

afterEach(cleanup);

describe("dashboardens periodfilter", () => {
  it("visar bara år som har skördedata", () => {
    render(<DashboardPeriodFilters availableYears={[2026, 2025]} initialYear={2026} />);
    expect(screen.getByLabelText("År")).toHaveValue("2026");
    expect(screen.getByLabelText("År")).toHaveTextContent("2026");
    expect(screen.getByLabelText("År")).toHaveTextContent("2025");
    expect(screen.getByLabelText("År")).not.toHaveTextContent("2024");
  });

  it("fyller i hela den valda månaden", () => {
    render(<DashboardPeriodFilters availableYears={[2026, 2025]} initialYear={2026} />);

    fireEvent.change(screen.getByLabelText("Månad"), { target: { value: "07" } });

    expect(screen.getByLabelText("Från")).toHaveValue("2026-07-01");
    expect(screen.getByLabelText("Till")).toHaveValue("2026-07-31");
  });

  it("uppdaterar månadsintervallet när året ändras", () => {
    render(<DashboardPeriodFilters availableYears={[2025, 2024]} initialYear={2024} initialMonth="02" initialFrom="2024-02-01" initialTo="2024-02-29" />);

    fireEvent.change(screen.getByLabelText("År"), { target: { value: "2025" } });

    expect(screen.getByLabelText("Från")).toHaveValue("2025-02-01");
    expect(screen.getByLabelText("Till")).toHaveValue("2025-02-28");
  });

  it("återgår till valfri period när ett datum ändras manuellt", () => {
    render(<DashboardPeriodFilters availableYears={[2026, 2025]} initialYear={2026} initialMonth="07" initialFrom="2026-07-01" initialTo="2026-07-31" />);

    fireEvent.change(screen.getByLabelText("Till"), { target: { value: "2026-07-15" } });

    expect(screen.getByLabelText("Månad")).toHaveValue("");
  });
});
