import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import type { Column } from "@tanstack/react-table";

// Minimal mock column factory
function createMockColumn(overrides: Partial<Column<unknown, unknown>> = {}) {
  return {
    getCanSort: vi.fn(() => true),
    getIsSorted: vi.fn(() => false),
    toggleSorting: vi.fn(),
    ...overrides,
  } as unknown as Column<unknown, unknown>;
}

describe("DataTableColumnHeader", () => {
  it("renders title text", () => {
    const col = createMockColumn();
    render(<DataTableColumnHeader column={col} title="Nombre" />);
    expect(screen.getByText("Nombre")).toBeInTheDocument();
  });

  it("renders as plain div when column is not sortable", () => {
    const col = createMockColumn({ getCanSort: vi.fn(() => false) });
    render(<DataTableColumnHeader column={col} title="ID" />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    // Should not be a button
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a button when column is sortable", () => {
    const col = createMockColumn();
    render(<DataTableColumnHeader column={col} title="Estado" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls toggleSorting on click", async () => {
    const user = userEvent.setup();
    const toggleSorting = vi.fn();
    const col = createMockColumn({ toggleSorting });

    render(<DataTableColumnHeader column={col} title="Estado" />);
    await user.click(screen.getByRole("button"));

    expect(toggleSorting).toHaveBeenCalledWith(false);
  });

  it("calls toggleSorting(true) when already sorted asc", async () => {
    const user = userEvent.setup();
    const toggleSorting = vi.fn();
    const col = createMockColumn({
      toggleSorting,
      getIsSorted: vi.fn(() => "asc" as const),
    });

    render(<DataTableColumnHeader column={col} title="Fecha" />);
    await user.click(screen.getByRole("button"));

    expect(toggleSorting).toHaveBeenCalledWith(true);
  });
});
