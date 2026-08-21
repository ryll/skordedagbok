import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({ saveCropGoals: vi.fn(async () => ({})) }));
import CropGoalManager from "@/components/crop-goal-manager";

const crops = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Tomat", active: true },
  { id: "22222222-2222-4222-8222-222222222222", name: "Isört", active: false },
];
const goals = [{ crop_type_id: crops[1].id, year: 2026, goal_weight_grams: 2500 }];

describe("målhantering", () => {
  it("visar och märker en inaktiv gröda som har ett mål", () => {
    render(<CropGoalManager crops={crops} goals={goals} year={2026} />);
    expect(screen.getByLabelText("Isört (inaktiv)")).toHaveValue(2.5);
  });

  it("märker inte aktiva grödor", () => {
    render(<CropGoalManager crops={crops} goals={goals} year={2026} />);
    expect(screen.getByLabelText("Tomat")).toHaveValue(null);
  });
});
