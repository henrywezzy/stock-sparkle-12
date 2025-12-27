import { useState, useRef } from "react";
import { format } from "date-fns";
import { Printer, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TermoEntrega } from "@/hooks/useTermosEntrega";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { DeliveryTermPrint } from "./DeliveryTermPrint";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface TermoViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termo: TermoEntrega | null;
}

export function TermoViewDialog({ open, onOpenChange, termo }: TermoViewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { settings: companySettings } = useCompanySettings();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!termo) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Render the HTML to canvas
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // A4 width in pixels at 96dpi
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit A4
      const imgWidth = pdfWidth - 16; // 8mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multi-page if content is longer than A4
      let heightLeft = imgHeight;
      let position = 8; // Top margin
      const pageHeight = pdfHeight - 16; // Available height per page
      
      // First page
      pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 8;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `termo-epi-${termo.employees?.registration_number || 'sem-matricula'}-${format(new Date(), 'yyyyMMdd')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="termo-dialog max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center gap-3">
            <span>Termo {termo.numero}</span>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="print-content">
          <DeliveryTermPrint termo={termo} companySettings={companySettings} />
        </div>

        <DialogFooter className="no-print gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Baixar PDF
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}