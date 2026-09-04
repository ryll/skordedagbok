import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HarvestFilters from "@/components/harvest-filters";

const crops = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Tomat", active: true },
  { id: "22222222-2222-4222-8222-222222222222", name: "Gurka", active: true },
];

const varieties = [
  { id: "33333333-3333-4333-8333-333333333333", crop_type_id: crops[0].id, name: "Sonnenherz", active: true },
  { id: "44444444-4444-4444-8444-444444444444", crop_type_id: crops[1].id, name: "Passandra", active: true },
];

const locations = [
  { id: "55555555-5555-4555-8555-555555555555", name: "Balkong", active: true },
];

describe("skördefilter", () => {
  it("renderar fält för år, gröda, sort och plats", () => {
    render(
      <HarvestFilters
        years={[2026, 2025]}
        crops={crops}
        varieties={varieties}
        locations={locations}
      />
    );

    expect(screen.getByLabelText("År")).toBeInTheDocument();
    expect(screen.getByLabelText("Gröda")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort")).toBeInTheDocument();
    expect(screen.getByLabelText("Plats")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filtrera" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Rensa" })).not.toBeInTheDocument();
  });

  it("visar rensalänk när filter är aktiva", () => {
    render(
      <HarvestFilters
        years={[2026, 2025]}
        crops={crops}
        varieties={varieties}
        locations={locations}
        initialYear={2026}
        initialCropTypeId={crops[0].id}
      />
    );

    expect(screen.getByRole("link", { name: "Rensa" })).toHaveAttribute("href", "/skordar");
  });

  it("filtrerar sorter efter vald gröda", () => {
    render(
      <HarvestFilters
        years={[2026, 2025]}
        crops={crops}
        varieties={varieties}
        locations={locations}
      />
    );

    // Inledningsvis visas båda
    expect(screen.getByText("Sonnenherz")).toBeInTheDocument();
    expect(screen.getByText("Passandra")).toBeInTheDocument();

    // Välj Tomat
    fireEvent.change(screen.getByLabelText("Gröda"), { target: { value: crops[0].id } });

    expect(screen.getByText("Sonnenherz")).toBeInTheDocument();
    expect(screen.queryByText("Passandra")).not.toBeInTheDocument();
  });
});
