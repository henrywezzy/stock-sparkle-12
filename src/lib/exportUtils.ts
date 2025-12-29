import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ExportColumn {
  key: string;
  header: string;
  render?: (item: any) => string;
}

export interface ExportOptions {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: any[];
}

// Export to CSV/Excel
export function exportToCSV(options: ExportOptions) {
  const { columns, data, filename } = options;
  
  // Header row
  const headers = columns.map(col => col.header).join(";");
  
  // Data rows
  const rows = data.map(item => 
    columns.map(col => {
      const value = col.render ? col.render(item) : item[col.key];
      // Escape quotes and wrap in quotes if contains semicolon or newline
      const strValue = String(value ?? "").replace(/"/g, '""');
      return strValue.includes(";") || strValue.includes("\n") ? `"${strValue}"` : strValue;
    }).join(";")
  );
  
  const csv = [headers, ...rows].join("\n");
  
  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Export to PDF
export function exportToPDF(options: ExportOptions) {
  const { title, columns, data, filename } = options;
  
  const doc = new jsPDF({
    orientation: columns.length > 5 ? "landscape" : "portrait",
  });
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);
  
  // Table
  const tableData = data.map(item =>
    columns.map(col => {
      const value = col.render ? col.render(item) : item[col.key];
      return String(value ?? "—");
    })
  );
  
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  // Footer with total count
  const finalY = (doc as any).lastAutoTable.finalY || 35;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Total de registros: ${data.length}`, 14, finalY + 10);
  
  doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
