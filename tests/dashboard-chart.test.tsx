import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardChart from "@/components/dashboard-chart";

describe("dashboard-diagram", () => {
  it("visar tomtext när det inte finns några rader", () => {
    render(<DashboardChart rows={[]} empty="Ingen data" />);
    expect(screen.getByText("Ingen data")).toBeInTheDocument();
  });

  it("renderar staplar med korrekt procent", () => {
    const { container } = render(<DashboardChart rows={[{ name: "Tomat", weightGrams: 500 }, { name: "Gurka", weightGrams: 1000 }]} />);
    const bars = container.querySelectorAll<HTMLElement>(".bar");
    expect(bars[0].style.width).toBe("50%");
    expect(bars[1].style.width).toBe("100%");
  });

  it("hanterar rader med 0 gram utan NaN%", () => {
    const { container } = render(<DashboardChart rows={[{ name: "Tomat", weightGrams: 0 }]} />);
    const bar = container.querySelector<HTMLElement>(".bar");
    expect(bar?.style.width).toBe("0%");
    expect(bar?.style.width).not.toContain("NaN");
  });
});
