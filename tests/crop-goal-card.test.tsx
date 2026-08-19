import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CropGoalCard from "@/components/crop-goal-card";

describe("grödans målkort", () => {
  it("placerar mållinjen halvvägs när skörden är dubbla målet", () => {
    const { container } = render(<CropGoalCard showGoalProgress crop={{
      id: "crop-1",
      name: "Tomat",
      weightGrams: 10000,
      quantity: 2,
      goalWeightGrams: 5000,
      varieties: [{ name: "Sonnenherz", weightGrams: 10000, quantity: 2 }],
    }} />);

    expect(screen.getByText("Tomat")).toBeInTheDocument();
    expect(screen.getByLabelText("Skördat 10 kg av målet 5 kg")).toBeInTheDocument();
    expect(container.querySelector<HTMLElement>(".goal-marker")?.style.left).toBe("50%");
    expect(screen.getByText("Sonnenherz")).toBeInTheDocument();
  });

  it("visar att årsmål saknas utan en meningslös förloppsindikator", () => {
    const { container } = render(<CropGoalCard showGoalProgress crop={{
      id: "crop-1",
      name: "Tomat",
      weightGrams: 1000,
      quantity: 1,
      goalWeightGrams: null,
      varieties: [],
    }} />);

    expect(container).toHaveTextContent("Inget mål satt");
    expect(container.querySelector(".goal-track")).not.toBeInTheDocument();
  });

  it("döljer årsmålet för en filtrerad delperiod", () => {
    const { container } = render(<CropGoalCard showGoalProgress={false} crop={{
      id: "crop-1",
      name: "Tomat",
      weightGrams: 1000,
      quantity: 1,
      goalWeightGrams: 5000,
      varieties: [],
    }} />);

    expect(container).toHaveTextContent("Totalt 1 kg");
    expect(container).not.toHaveTextContent("Mål 5 kg");
    expect(container.querySelector(".goal-track")).not.toBeInTheDocument();
  });
});
