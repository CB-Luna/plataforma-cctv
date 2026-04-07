import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "@/components/data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";

type TestRow = { id: string; name: string; status: string };

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "status", header: "Estado" },
];

const data: TestRow[] = [
  { id: "1", name: "Cámara Norte", status: "online" },
  { id: "2", name: "Cámara Sur", status: "offline" },
  { id: "3", name: "Cámara Este", status: "online" },
];

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Estado")).toBeInTheDocument();
  });

  it("renders all rows", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("Cámara Norte")).toBeInTheDocument();
    expect(screen.getByText("Cámara Sur")).toBeInTheDocument();
    expect(screen.getByText("Cámara Este")).toBeInTheDocument();
  });

  it("shows 'Sin resultados' when data is empty", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });

  it("shows loading skeletons when isLoading", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} isLoading />
    );
    const pulseElements = container.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("filters rows when using search", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Buscar cámara..."
      />
    );

    const search = screen.getByPlaceholderText("Buscar cámara...");
    await user.type(search, "Norte");

    expect(screen.getByText("Cámara Norte")).toBeInTheDocument();
    expect(screen.queryByText("Cámara Sur")).not.toBeInTheDocument();
  });

  it("shows pagination info", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText(/registro\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/Pág\./)).toBeInTheDocument();
  });

  it("renders toolbar when provided", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        toolbar={<button data-testid="custom-toolbar">Action</button>}
      />
    );
    expect(screen.getByTestId("custom-toolbar")).toBeInTheDocument();
  });
});
