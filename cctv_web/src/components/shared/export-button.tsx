"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export interface ExportColumn {
  header: string;
  accessorKey: string;
}

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename: string;
}

export function ExportButton({ data, columns, filename }: ExportButtonProps) {
  async function exportExcel() {
    const XLSX = await import("xlsx");
    const rows = data.map((row) =>
      Object.fromEntries(columns.map((col) => [col.header, row[col.accessorKey] ?? ""]))
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.text(filename, 14, 15);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleString("es-MX"), 14, 22);

    const head = [columns.map((c) => c.header)];
    const body = data.map((row) => columns.map((col) => String(row[col.accessorKey] ?? "")));

    autoTable(doc, {
      head,
      body,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    doc.save(`${filename}.pdf`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
        <Download className="h-4 w-4" />
        Exportar
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPdf}>
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
