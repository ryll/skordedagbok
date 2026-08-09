import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({ saveHarvest: vi.fn(async () => ({})) }));
import HarvestForm from "@/components/harvest-form";

const crops = [{ id: "11111111-1111-4111-8111-111111111111", name: "Tomat", active: true }, { id: "22222222-2222-4222-8222-222222222222", name: "Gurka", active: false }];
const varieties = [{ id: "33333333-3333-4333-8333-333333333333", crop_type_id: crops[0].id, name: "Sonnenherz", active: true }, { id: "44444444-4444-4444-8444-444444444444", crop_type_id: crops[1].id, name: "Gammal", active: false }];
const locations = [{ id: "55555555-5555-4555-8555-555555555555", name: "Balkong", active: true }];

describe("skördeformulär", () => {
  beforeEach(() => render(<HarvestForm crops={crops} varieties={varieties} locations={locations} />));
  it("visar bara sorter för vald gröda", () => { expect(screen.queryByText("Sonnenherz")).not.toBeInTheDocument(); fireEvent.change(screen.getByLabelText("Gröda *"), { target: { value: crops[0].id } }); expect(screen.getByText("Sonnenherz")).toBeInTheDocument(); expect(screen.queryByText(/Gammal/)).not.toBeInTheDocument(); });
  it("döljer inaktiva katalogposter vid nyregistrering", () => expect(screen.queryByText(/Gurka/)).not.toBeInTheDocument());
});
