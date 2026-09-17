import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageLoading from "@/components/page-loading";

describe("page loading state", () => {
  it("announces that content is loading", () => {
    render(<PageLoading title="Översikt" />);

    expect(screen.getByRole("heading", { name: "Översikt" })).toBeInTheDocument();
    expect(screen.getByLabelText("Laddar innehåll")).toHaveAttribute("aria-busy", "true");
  });
});
