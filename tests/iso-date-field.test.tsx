import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import IsoDateField, { isIsoDate } from "@/components/iso-date-field";

afterEach(cleanup);

describe("ISO-datumfält", () => {
  it("godkänner bara verkliga datum i formatet YYYY-MM-DD", () => {
    expect(isIsoDate("2026-08-09")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("09/08/2026")).toBe(false);
  });

  it("visar ISO-format och avråder Dashlane från autofyllning", () => {
    render(<IsoDateField id="fran" name="fran" label="Från" defaultValue="2026-08-09" />);

    const field = screen.getByLabelText("Från");
    expect(field).toHaveAttribute("type", "text");
    expect(field).toHaveAttribute("name", "fran");
    expect(field).toHaveAttribute("placeholder", "YYYY-MM-DD");
    expect(field).toHaveAttribute("autocomplete", "off");
    expect(field).toHaveAttribute("data-form-type", "other");
    expect(field).toHaveValue("2026-08-09");
  });

  it("synkroniserar datum som väljs i kalendern", () => {
    const { container } = render(<IsoDateField id="till" name="till" label="Till" />);
    const picker = container.querySelector<HTMLInputElement>('input[type="date"]');

    fireEvent.change(picker!, { target: { value: "2026-12-24" } });

    expect(screen.getByLabelText("Till")).toHaveValue("2026-12-24");
  });

  it("markerar ett omöjligt datum som ogiltigt", async () => {
    render(<IsoDateField id="fran" name="fran" label="Från" />);
    const field = screen.getByLabelText("Från");

    fireEvent.change(field, { target: { value: "2026-02-31" } });

    await waitFor(() => expect(field).toBeInvalid());
  });
});
