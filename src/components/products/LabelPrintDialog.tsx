import { useState, useEffect, useRef } from "react";
import { Printer, QrCode, Barcode, Minus, Plus, X, Download } from "lucide-react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
}

interface LabelPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  selectedProductIds?: string[];
}

type CodeType = "barcode" | "qrcode";
type LabelSize = "small" | "medium" | "large";

interface LabelConfig {
  codeType: CodeType;
  labelSize: LabelSize;
  showProductName: boolean;
  showSku: boolean;
  showQuantity: boolean;
  copiesPerProduct: number;
}

const LABEL_SIZES = {
  small: { width: 40, height: 25, name: "Pequena (40x25mm)" },
  medium: { width: 60, height: 40, name: "Média (60x40mm)" },
  large: { width: 100, height: 60, name: "Grande (100x60mm)" },
};

export function LabelPrintDialog({
  open,
  onOpenChange,
  products,
  selectedProductIds = [],
}: LabelPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<LabelConfig>({
    codeType: "qrcode",
    labelSize: "medium",
    showProductName: true,
    showSku: true,
    showQuantity: false,
    copiesPerProduct: 1,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<Map<string, string>>(new Map());

  // Initialize selected products
  useEffect(() => {
    if (open) {
      setSelectedIds(selectedProductIds.length > 0 ? selectedProductIds : products.map(p => p.id));
    }
  }, [open, selectedProductIds, products]);

  // Generate codes when config or selection changes
  useEffect(() => {
    const generateCodes = async () => {
      const codes = new Map<string, string>();
      
      for (const product of products.filter(p => selectedIds.includes(p.id))) {
        const codeValue = product.barcode || product.sku || product.id;
        
        try {
          if (config.codeType === "qrcode") {
            const qrDataUrl = await QRCode.toDataURL(codeValue, {
              width: config.labelSize === "small" ? 80 : config.labelSize === "medium" ? 120 : 160,
              margin: 1,
              color: { dark: "#000000", light: "#ffffff" },
            });
            codes.set(product.id, qrDataUrl);
          } else {
            // Barcode - create SVG
            const canvas = document.createElement("canvas");
            try {
              JsBarcode(canvas, codeValue, {
                format: "CODE128",
                width: config.labelSize === "small" ? 1 : 2,
                height: config.labelSize === "small" ? 30 : config.labelSize === "medium" ? 40 : 60,
                displayValue: false,
                margin: 0,
              });
              codes.set(product.id, canvas.toDataURL());
            } catch (e) {
              // If barcode generation fails, try with a simplified value
              const safeValue = codeValue.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) || "NOCODE";
              JsBarcode(canvas, safeValue, {
                format: "CODE128",
                width: config.labelSize === "small" ? 1 : 2,
                height: config.labelSize === "small" ? 30 : config.labelSize === "medium" ? 40 : 60,
                displayValue: false,
                margin: 0,
              });
              codes.set(product.id, canvas.toDataURL());
            }
          }
        } catch (error) {
          console.error("Error generating code for product:", product.id, error);
        }
      }
      
      setGeneratedCodes(codes);
    };

    if (selectedIds.length > 0) {
      generateCodes();
    }
  }, [products, selectedIds, config.codeType, config.labelSize]);

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(products.map(p => p.id));
  const deselectAll = () => setSelectedIds([]);

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    
    if (printWindow) {
      const labelWidth = LABEL_SIZES[config.labelSize].width;
      const labelHeight = LABEL_SIZES[config.labelSize].height;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Etiquetas - Stockly</title>
            <style>
              @page {
                size: auto;
                margin: 5mm;
              }
              body {
                margin: 0;
                padding: 10px;
                font-family: Arial, sans-serif;
              }
              .labels-container {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
              }
              .label {
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
                border: 1px solid #ccc;
                padding: 2mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                page-break-inside: avoid;
              }
              .label img {
                max-width: 100%;
                max-height: ${labelHeight * 0.5}mm;
                object-fit: contain;
              }
              .label-text {
                font-size: ${config.labelSize === "small" ? "6pt" : config.labelSize === "medium" ? "8pt" : "10pt"};
                text-align: center;
                margin-top: 1mm;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 100%;
              }
              .label-sku {
                font-size: ${config.labelSize === "small" ? "5pt" : config.labelSize === "medium" ? "7pt" : "9pt"};
                color: #666;
              }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));
  const totalLabels = selectedProducts.length * config.copiesPerProduct;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Gerar Etiquetas
          </DialogTitle>
          <DialogDescription>
            Gere e imprima etiquetas com código de barras ou QR code para seus produtos
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6 overflow-y-auto pr-2">
            {/* Code Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de Código</Label>
              <RadioGroup
                value={config.codeType}
                onValueChange={(value) => setConfig(prev => ({ ...prev, codeType: value as CodeType }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="qrcode" id="qrcode" />
                  <Label htmlFor="qrcode" className="flex items-center gap-2 cursor-pointer">
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="barcode" id="barcode" />
                  <Label htmlFor="barcode" className="flex items-center gap-2 cursor-pointer">
                    <Barcode className="w-4 h-4" />
                    Código de Barras
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Label Size */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tamanho da Etiqueta</Label>
              <RadioGroup
                value={config.labelSize}
                onValueChange={(value) => setConfig(prev => ({ ...prev, labelSize: value as LabelSize }))}
                className="flex flex-col gap-2"
              >
                {Object.entries(LABEL_SIZES).map(([key, size]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <RadioGroupItem value={key} id={`size-${key}`} />
                    <Label htmlFor={`size-${key}`} className="cursor-pointer">
                      {size.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Informações na Etiqueta</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showName"
                    checked={config.showProductName}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, showProductName: !!checked }))
                    }
                  />
                  <Label htmlFor="showName" className="cursor-pointer">Nome do produto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showSku"
                    checked={config.showSku}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, showSku: !!checked }))
                    }
                  />
                  <Label htmlFor="showSku" className="cursor-pointer">SKU / Código</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showQty"
                    checked={config.showQuantity}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, showQuantity: !!checked }))
                    }
                  />
                  <Label htmlFor="showQty" className="cursor-pointer">Quantidade em estoque</Label>
                </div>
              </div>
            </div>

            {/* Copies per product */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Cópias por Produto</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setConfig(prev => ({ 
                    ...prev, 
                    copiesPerProduct: Math.max(1, prev.copiesPerProduct - 1) 
                  }))}
                  disabled={config.copiesPerProduct <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={config.copiesPerProduct}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    copiesPerProduct: Math.max(1, parseInt(e.target.value) || 1) 
                  }))}
                  className="w-20 text-center"
                  min={1}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setConfig(prev => ({ 
                    ...prev, 
                    copiesPerProduct: prev.copiesPerProduct + 1 
                  }))}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Product Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Produtos ({selectedIds.length} selecionados)</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Todos
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Nenhum
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-40 border rounded-lg p-2">
                <div className="space-y-1">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedIds.includes(product.id) 
                          ? "bg-primary/10 border border-primary/20" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <Checkbox checked={selectedIds.includes(product.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sku || product.barcode || "Sem código"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Pré-visualização</Label>
              <Badge variant="secondary">{totalLabels} etiqueta(s)</Badge>
            </div>
            
            <ScrollArea className="flex-1 border rounded-lg bg-muted/30 p-4">
              <div 
                ref={printRef}
                className="labels-container flex flex-wrap gap-2 justify-center"
              >
                {selectedProducts.flatMap(product => 
                  Array.from({ length: config.copiesPerProduct }).map((_, copyIndex) => (
                    <div
                      key={`${product.id}-${copyIndex}`}
                      className={cn(
                        "label bg-white border border-border rounded-lg flex flex-col items-center justify-center p-2",
                        config.labelSize === "small" && "w-[100px] h-[70px]",
                        config.labelSize === "medium" && "w-[150px] h-[100px]",
                        config.labelSize === "large" && "w-[250px] h-[150px]",
                      )}
                    >
                      {generatedCodes.get(product.id) && (
                        <img 
                          src={generatedCodes.get(product.id)} 
                          alt="Code"
                          className={cn(
                            "object-contain",
                            config.labelSize === "small" && "max-h-[30px]",
                            config.labelSize === "medium" && "max-h-[50px]",
                            config.labelSize === "large" && "max-h-[80px]",
                          )}
                        />
                      )}
                      {config.showProductName && (
                        <p className={cn(
                          "label-text font-medium text-center truncate w-full mt-1",
                          config.labelSize === "small" && "text-[8px]",
                          config.labelSize === "medium" && "text-[10px]",
                          config.labelSize === "large" && "text-xs",
                        )}>
                          {product.name}
                        </p>
                      )}
                      {config.showSku && (
                        <p className={cn(
                          "label-sku text-muted-foreground truncate w-full text-center",
                          config.labelSize === "small" && "text-[6px]",
                          config.labelSize === "medium" && "text-[8px]",
                          config.labelSize === "large" && "text-[10px]",
                        )}>
                          {product.sku || product.barcode || product.id.slice(0, 8)}
                        </p>
                      )}
                      {config.showQuantity && (
                        <p className={cn(
                          "text-muted-foreground",
                          config.labelSize === "small" && "text-[6px]",
                          config.labelSize === "medium" && "text-[8px]",
                          config.labelSize === "large" && "text-[10px]",
                        )}>
                          Qtd: {product.quantity}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handlePrint}
            disabled={selectedIds.length === 0}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir {totalLabels} Etiqueta(s)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}