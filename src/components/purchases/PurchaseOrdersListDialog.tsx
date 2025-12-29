import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PurchaseOrder, usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { PurchaseOrderPrint } from "./PurchaseOrderPrint";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  FileText,
  Printer,
  Download,
  Trash2,
  Eye,
  Loader2,
  Truck,
  Calendar,
  Mail,
  Send,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrdersListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  enviada: { label: 'Enviada', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  confirmada: { label: 'Confirmada', className: 'bg-warning/20 text-warning' },
  recebida: { label: 'Recebida', className: 'bg-success/20 text-success' },
  cancelada: { label: 'Cancelada', className: 'bg-destructive/20 text-destructive' },
};

export function PurchaseOrdersListDialog({
  open,
  onOpenChange,
}: PurchaseOrdersListDialogProps) {
  const { orders, isLoading, updateStatus, deleteOrder, fetchOrderById } = usePurchaseOrders();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailRecipientName, setEmailRecipientName] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handleViewOrder = async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      const order = await fetchOrderById(orderId);
      if (order) {
        setSelectedOrder(order);
        setViewDialogOpen(true);
      }
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Ordem de Compra - ${selectedOrder?.numero}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !selectedOrder) return;
    
    setIsPrinting(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight
      );

      pdf.save(`ordem-compra-${selectedOrder.numero}.pdf`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleOpenEmailDialog = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setEmailRecipient(order.supplier?.email || "");
    setEmailRecipientName(order.supplier?.name || "");
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedOrder || !emailRecipient) return;

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-purchase-order-email', {
        body: {
          orderId: selectedOrder.id,
          recipientEmail: emailRecipient,
          recipientName: emailRecipientName || emailRecipient,
        },
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: `A ordem de compra ${selectedOrder.numero} foi enviada para ${emailRecipient}`,
      });
      
      setEmailDialogOpen(false);
      setEmailRecipient("");
      setEmailRecipientName("");
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email. Verifique as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateStatus.mutateAsync({ id: orderId, status: newStatus });
  };

  const handleDeleteConfirm = async () => {
    if (orderToDelete) {
      await deleteOrder.mutateAsync(orderToDelete);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass border-border max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Ordens de Compra
            </DialogTitle>
            <DialogDescription>
              Visualize e gerencie todas as ordens de compra geradas
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p>Nenhuma ordem de compra encontrada</p>
              <p className="text-sm">Gere uma ordem selecionando produtos na lista</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">
                        {order.numero}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(order.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          {order.supplier?.name || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                          disabled={updateStatus.isPending}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "font-medium",
                                STATUS_CONFIG[order.status]?.className
                              )}
                            >
                              {STATUS_CONFIG[order.status]?.label || order.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rascunho">Rascunho</SelectItem>
                            <SelectItem value="enviada">Enviada</SelectItem>
                            <SelectItem value="confirmada">Confirmada</SelectItem>
                            <SelectItem value="recebida">Recebida</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewOrder(order.id)}
                            disabled={loadingOrderId === order.id}
                            title="Visualizar"
                          >
                            {loadingOrderId === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEmailDialog(order)}
                            title="Enviar por email"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setOrderToDelete(order.id);
                              setDeleteDialogOpen(true);
                            }}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="glass border-border max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedOrder?.numero}
            </DialogTitle>
            <DialogDescription>
              Visualização da ordem de compra
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <>
              <div className="overflow-x-auto">
                <PurchaseOrderPrint ref={printRef} order={selectedOrder} />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleOpenEmailDialog(selectedOrder);
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Email
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={handleDownloadPDF} disabled={isPrinting}>
                  {isPrinting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Baixar PDF
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="glass border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Enviar Ordem por Email
            </DialogTitle>
            <DialogDescription>
              Envie a ordem de compra {selectedOrder?.numero} diretamente para o fornecedor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Nome do Destinatário</Label>
              <Input
                id="recipientName"
                value={emailRecipientName}
                onChange={(e) => setEmailRecipientName(e.target.value)}
                placeholder="Nome do contato"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Email do Destinatário *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="email@fornecedor.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={!emailRecipient || isSendingEmail}
            >
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ordem de Compra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem de compra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrder.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
