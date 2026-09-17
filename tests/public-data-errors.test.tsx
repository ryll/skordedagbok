import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/page";
import HarvestsPage from "@/app/skordar/page";

const mocks = vi.hoisted(() => ({
  getCatalogs: vi.fn(),
  getCropGoals: vi.fn(),
  getDashboardRows: vi.fn(),
  getHarvests: vi.fn(),
  getHarvestYears: vi.fn(),
  isSupabaseConfigured: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getCatalogs: mocks.getCatalogs,
  getCropGoals: mocks.getCropGoals,
  getDashboardRows: mocks.getDashboardRows,
  getHarvests: mocks.getHarvests,
  getHarvestYears: mocks.getHarvestYears,
}));

vi.mock("@/lib/supabase/server", () => ({ isSupabaseConfigured: mocks.isSupabaseConfigured }));

type AsyncElement = ReactElement<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;

async function resolvePage(page: ReactElement) {
  const content = (page as ReactElement<{ children: AsyncElement }>).props.children;
  const Content = content.type as (props: AsyncElement["props"]) => Promise<ReactElement>;
  return Content(content.props);
}

describe("public data errors", () => {
  beforeEach(() => {
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getCatalogs.mockResolvedValue({ crops: [], varieties: [], locations: [] });
    mocks.getHarvestYears.mockResolvedValue([]);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("does not present a dashboard query failure as zero-valued statistics", async () => {
    mocks.getCatalogs.mockRejectedValue(new Error("temporary failure"));

    render(await resolvePage(DashboardPage({ searchParams: Promise.resolve({}) })));

    expect(screen.getByRole("alert")).toHaveTextContent("Kunde inte hämta skördedata just nu");
    expect(screen.queryByText("Total vikt")).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith("Failed to load dashboard catalogs and harvest years", expect.any(Error));
  });

  it("does not present a harvest-history query failure as an empty journal", async () => {
    mocks.getHarvests.mockRejectedValue(new Error("temporary failure"));

    render(await resolvePage(HarvestsPage({ searchParams: Promise.resolve({}) })));

    expect(screen.getByRole("alert")).toHaveTextContent("Kunde inte hämta skördedata just nu");
    expect(screen.queryByText("Inga skördar att visa ännu.")).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith("Failed to load harvest history", expect.any(Error));
  });

  it("shows setup guidance only for missing configuration outside production", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(false);
    vi.stubEnv("NODE_ENV", "development");

    render(await resolvePage(DashboardPage({ searchParams: Promise.resolve({}) })));

    expect(screen.getByRole("alert")).toHaveTextContent("Anslut Supabase");
    expect(mocks.getCatalogs).not.toHaveBeenCalled();
  });

  it("hides setup details when production configuration is missing", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(false);
    vi.stubEnv("NODE_ENV", "production");

    render(await resolvePage(DashboardPage({ searchParams: Promise.resolve({}) })));

    expect(screen.getByRole("alert")).toHaveTextContent("Kunde inte hämta skördedata just nu");
    expect(screen.queryByText("Anslut Supabase", { exact: false })).not.toBeInTheDocument();
  });
});
