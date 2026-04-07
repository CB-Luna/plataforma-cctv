import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/theme-provider";

// Mock stores
const mockTheme = vi.fn(() => "light");
const mockCurrentCompany = vi.fn(() => null);

vi.mock("@/stores/theme-store", () => ({
  useThemeStore: (selector: (s: { theme: string }) => string) =>
    selector({ theme: mockTheme() }),
}));

vi.mock("@/stores/tenant-store", () => ({
  useTenantStore: (selector: (s: { currentCompany: unknown }) => unknown) =>
    selector({ currentCompany: mockCurrentCompany() }),
}));

describe("ThemeProvider", () => {
  beforeEach(() => {
    cleanup();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.removeProperty("--tenant-primary");
    document.documentElement.style.removeProperty("--tenant-secondary");
    document.documentElement.style.removeProperty("--tenant-tertiary");
    mockTheme.mockReturnValue("light");
    mockCurrentCompany.mockReturnValue(null);
  });

  it("renders children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Hello</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("adds 'dark' class when theme is dark", () => {
    mockTheme.mockReturnValue("dark");
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes 'dark' class when theme is light", () => {
    document.documentElement.classList.add("dark");
    mockTheme.mockReturnValue("light");
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies tenant custom colors", () => {
    mockCurrentCompany.mockReturnValue({
      id: "1",
      name: "Test Co",
      primary_color: "#ff0000",
      secondary_color: "#00ff00",
      tertiary_color: "#0000ff",
    });
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );
    expect(document.documentElement.style.getPropertyValue("--tenant-primary")).toBe("#ff0000");
    expect(document.documentElement.style.getPropertyValue("--tenant-secondary")).toBe("#00ff00");
    expect(document.documentElement.style.getPropertyValue("--tenant-tertiary")).toBe("#0000ff");
  });

  it("does not set custom colors when no company", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );
    expect(document.documentElement.style.getPropertyValue("--tenant-primary")).toBe("");
  });
});
