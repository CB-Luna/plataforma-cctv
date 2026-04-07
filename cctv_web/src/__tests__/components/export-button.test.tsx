import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportButton, type ExportColumn } from "@/components/shared/export-button";

// Mock xlsx and jspdf dynamic imports
vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

const saveSpy = vi.fn();

vi.mock("jspdf", () => {
  return {
    jsPDF: class MockPDF {
      setFontSize = vi.fn();
      text = vi.fn();
      save = saveSpy;
    },
  };
});

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

const columns: ExportColumn[] = [
  { header: "Nombre", accessorKey: "name" },
  { header: "Estado", accessorKey: "status" },
];

const data = [
  { name: "Cámara 1", status: "online" },
  { name: "Cámara 2", status: "offline" },
];

describe("ExportButton", () => {
  it("renders export button with text", () => {
    render(<ExportButton data={data} columns={columns} filename="test" />);
    expect(screen.getByText("Exportar")).toBeInTheDocument();
  });

  it("shows export options on click", async () => {
    const user = userEvent.setup();
    render(<ExportButton data={data} columns={columns} filename="test" />);

    await user.click(screen.getByText("Exportar"));

    expect(screen.getByText("Excel (.xlsx)")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  it("calls xlsx export on Excel click", async () => {
    const user = userEvent.setup();
    render(<ExportButton data={data} columns={columns} filename="cameras" />);

    await user.click(screen.getByText("Exportar"));
    await user.click(screen.getByText("Excel (.xlsx)"));

    const XLSX = await import("xlsx");
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), "cameras.xlsx");
  });

  it("calls jsPDF export on PDF click", async () => {
    const user = userEvent.setup();
    render(<ExportButton data={data} columns={columns} filename="cameras" />);

    await user.click(screen.getByText("Exportar"));
    await user.click(screen.getByText("PDF"));

    expect(saveSpy).toHaveBeenCalledWith("cameras.pdf");
  });
});
