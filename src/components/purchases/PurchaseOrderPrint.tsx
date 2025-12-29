import { forwardRef } from "react";
import { PurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PurchaseOrderPrintProps {
  order: PurchaseOrder;
}

export const PurchaseOrderPrint = forwardRef<HTMLDivElement, PurchaseOrderPrintProps>(
  ({ order }, ref) => {
    const { settings } = useCompanySettings();

    const statusLabels: Record<string, string> = {
      rascunho: 'Rascunho',
      enviada: 'Enviada',
      confirmada: 'Confirmada',
      recebida: 'Recebida',
      cancelada: 'Cancelada',
    };

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-8 min-w-[800px]"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-300 pb-4 mb-6">
          <div className="flex items-center gap-4">
            {settings?.logo_url && (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="h-16 w-auto object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {settings?.name || 'Empresa'}
              </h1>
              {settings?.cnpj && (
                <p className="text-sm text-gray-600">CNPJ: {settings.cnpj}</p>
              )}
              {settings?.address && (
                <p className="text-sm text-gray-600">{settings.address}</p>
              )}
              {(settings?.city || settings?.state) && (
                <p className="text-sm text-gray-600">
                  {settings.city}{settings.city && settings.state ? ' - ' : ''}{settings.state}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-blue-600">ORDEM DE COMPRA</h2>
            <p className="text-lg font-semibold mt-1">{order.numero}</p>
            <p className="text-sm text-gray-600">
              Emissão: {format(new Date(order.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            {order.data_entrega && (
              <p className="text-sm text-gray-600">
                Entrega: {format(new Date(order.data_entrega), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
            <span 
              className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full"
              style={{
                backgroundColor: 
                  order.status === 'rascunho' ? '#e5e7eb' :
                  order.status === 'enviada' ? '#dbeafe' :
                  order.status === 'confirmada' ? '#fef3c7' :
                  order.status === 'recebida' ? '#d1fae5' :
                  '#fee2e2',
                color:
                  order.status === 'rascunho' ? '#374151' :
                  order.status === 'enviada' ? '#1e40af' :
                  order.status === 'confirmada' ? '#92400e' :
                  order.status === 'recebida' ? '#065f46' :
                  '#991b1b'
              }}
            >
              {statusLabels[order.status] || order.status}
            </span>
          </div>
        </div>

        {/* Supplier Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
            Fornecedor
          </h3>
          {order.supplier ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-lg">{order.supplier.name}</p>
                {order.supplier.cnpj && (
                  <p className="text-sm text-gray-600">CNPJ: {order.supplier.cnpj}</p>
                )}
              </div>
              <div className="text-right">
                {order.supplier.email && (
                  <p className="text-sm text-gray-600">{order.supplier.email}</p>
                )}
                {order.supplier.phone && (
                  <p className="text-sm text-gray-600">{order.supplier.phone}</p>
                )}
                {order.supplier.address && (
                  <p className="text-sm text-gray-600">{order.supplier.address}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Fornecedor não informado</p>
          )}
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Condições de Pagamento</p>
            <p className="font-semibold">{order.condicoes_pagamento || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Frete</p>
            <p className="font-semibold">{order.frete || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Solicitante</p>
            <p className="font-semibold">{order.solicitante || '—'}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-2 text-left text-sm font-semibold">Item</th>
              <th className="p-2 text-left text-sm font-semibold">Código</th>
              <th className="p-2 text-left text-sm font-semibold">Descrição</th>
              <th className="p-2 text-center text-sm font-semibold">Und</th>
              <th className="p-2 text-center text-sm font-semibold">Qtd</th>
              <th className="p-2 text-right text-sm font-semibold">Preço Unit.</th>
              <th className="p-2 text-right text-sm font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr 
                key={item.id} 
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="p-2 text-sm border-b border-gray-200">
                  {String(index + 1).padStart(2, '0')}
                </td>
                <td className="p-2 text-sm border-b border-gray-200 font-mono">
                  {item.codigo || '—'}
                </td>
                <td className="p-2 text-sm border-b border-gray-200">
                  {item.descricao}
                </td>
                <td className="p-2 text-sm border-b border-gray-200 text-center">
                  {item.unidade}
                </td>
                <td className="p-2 text-sm border-b border-gray-200 text-center font-semibold">
                  {item.quantidade}
                </td>
                <td className="p-2 text-sm border-b border-gray-200 text-right">
                  {formatCurrency(item.valor_unitario)}
                </td>
                <td className="p-2 text-sm border-b border-gray-200 text-right font-semibold">
                  {formatCurrency(item.subtotal || item.quantidade * item.valor_unitario)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-600 text-white">
              <td colSpan={6} className="p-3 text-right font-bold">
                TOTAL
              </td>
              <td className="p-3 text-right font-bold text-lg">
                {formatCurrency(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {order.observacoes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-yellow-800 mb-1">Observações</h4>
            <p className="text-sm text-yellow-700 whitespace-pre-wrap">{order.observacoes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mx-8">
                <p className="text-sm text-gray-600">Responsável pela Compra</p>
                <p className="font-semibold">{settings?.name || 'Empresa'}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mx-8">
                <p className="text-sm text-gray-600">Fornecedor (Aceite)</p>
                <p className="font-semibold">{order.supplier?.name || '—'}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-6">
            Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    );
  }
);

PurchaseOrderPrint.displayName = "PurchaseOrderPrint";
