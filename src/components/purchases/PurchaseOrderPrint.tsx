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

    const statusColors: Record<string, { bg: string; text: string }> = {
      rascunho: { bg: '#f3f4f6', text: '#4b5563' },
      enviada: { bg: '#dbeafe', text: '#1d4ed8' },
      confirmada: { bg: '#fef3c7', text: '#b45309' },
      recebida: { bg: '#d1fae5', text: '#047857' },
      cancelada: { bg: '#fee2e2', text: '#dc2626' },
    };

    const statusStyle = statusColors[order.status] || statusColors.rascunho;

    return (
      <div 
        ref={ref} 
        className="bg-white text-black min-w-[800px]"
        style={{ fontFamily: 'Segoe UI, Arial, sans-serif', padding: '32px 40px' }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {settings?.logo_url && (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
              />
            )}
            <div>
              <h1 style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                color: '#111827',
                margin: 0,
                lineHeight: 1.3
              }}>
                {settings?.name || 'Empresa'}
              </h1>
              {settings?.cnpj && (
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>
                  CNPJ: {settings.cnpj}
                </p>
              )}
              {settings?.address && (
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0' }}>
                  {settings.address}
                  {settings.city && ` - ${settings.city}`}
                  {settings.state && `/${settings.state}`}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              justifyContent: 'flex-end',
              marginBottom: '4px'
            }}>
              <h2 style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#2563eb',
                margin: 0,
                letterSpacing: '0.5px'
              }}>
                ORDEM DE COMPRA
              </h2>
              <span 
                style={{
                  padding: '3px 10px',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}
              >
                {statusLabels[order.status] || order.status}
              </span>
            </div>
            <p style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              color: '#111827',
              margin: '4px 0'
            }}>
              {order.numero}
            </p>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0' }}>
              Emissão: {format(new Date(order.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            {order.data_entrega && (
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0' }}>
                Entrega prevista: {format(new Date(order.data_entrega), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>

        {/* Supplier Info */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px', 
            padding: '14px 16px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              color: '#64748b', 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 8px 0'
            }}>
              Fornecedor
            </p>
            {order.supplier ? (
              <>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
                  {order.supplier.name}
                </p>
                {order.supplier.cnpj && (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>
                    CNPJ: {order.supplier.cnpj}
                  </p>
                )}
                {order.supplier.email && (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>
                    {order.supplier.email}
                  </p>
                )}
                {order.supplier.phone && (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>
                    Tel: {order.supplier.phone}
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Não informado</p>
            )}
          </div>

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div style={{ 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              padding: '12px 14px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                Pagamento
              </p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {order.condicoes_pagamento || '—'}
              </p>
            </div>
            <div style={{ 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              padding: '12px 14px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                Frete
              </p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {order.frete || '—'}
              </p>
            </div>
            <div style={{ 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              gridColumn: 'span 2'
            }}>
              <p style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                Solicitante
              </p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {order.solicitante || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          marginBottom: '20px',
          fontSize: '12px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#1e40af' }}>
              <th style={{ 
                padding: '10px 12px', 
                textAlign: 'center', 
                color: 'white',
                fontWeight: 600,
                fontSize: '11px',
                borderRadius: '6px 0 0 0'
              }}>
                #
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: 'white', fontWeight: 600, fontSize: '11px' }}>
                Código
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: 'white', fontWeight: 600, fontSize: '11px' }}>
                Descrição
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: 'white', fontWeight: 600, fontSize: '11px' }}>
                Und
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: 'white', fontWeight: 600, fontSize: '11px' }}>
                Qtd
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: 'white', fontWeight: 600, fontSize: '11px' }}>
                Preço Unit.
              </th>
              <th style={{ 
                padding: '10px 12px', 
                textAlign: 'right', 
                color: 'white',
                fontWeight: 600,
                fontSize: '11px',
                borderRadius: '0 6px 0 0'
              }}>
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr 
                key={item.id} 
                style={{ 
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #e2e8f0'
                }}
              >
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                  {String(index + 1).padStart(2, '0')}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>
                  {item.codigo || '—'}
                </td>
                <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 500 }}>
                  {item.descricao}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                  {item.unidade}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>
                  {item.quantidade}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                  {formatCurrency(item.valor_unitario)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  {formatCurrency(item.subtotal || item.quantidade * item.valor_unitario)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#1e40af' }}>
              <td 
                colSpan={6} 
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'right', 
                  fontWeight: 700,
                  color: 'white',
                  fontSize: '13px',
                  borderRadius: '0 0 0 6px'
                }}
              >
                TOTAL
              </td>
              <td 
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'right', 
                  fontWeight: 700,
                  color: 'white',
                  fontSize: '15px',
                  borderRadius: '0 0 6px 0'
                }}
              >
                {formatCurrency(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {order.observacoes && (
          <div style={{ 
            backgroundColor: '#fffbeb', 
            border: '1px solid #fcd34d', 
            borderRadius: '8px', 
            padding: '12px 16px',
            marginBottom: '24px'
          }}>
            <p style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              color: '#b45309', 
              textTransform: 'uppercase',
              margin: '0 0 6px 0'
            }}>
              Observações
            </p>
            <p style={{ fontSize: '12px', color: '#78350f', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {order.observacoes}
            </p>
          </div>
        )}

        {/* Footer - Signatures */}
        <div style={{ 
          borderTop: '1px solid #e2e8f0', 
          paddingTop: '24px', 
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '48px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              borderTop: '1px solid #94a3b8', 
              marginTop: '40px',
              paddingTop: '8px'
            }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0' }}>
                Responsável pela Compra
              </p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {settings?.name || 'Empresa'}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              borderTop: '1px solid #94a3b8', 
              marginTop: '40px',
              paddingTop: '8px'
            }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0' }}>
                Fornecedor (Aceite)
              </p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {order.supplier?.name || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Generated timestamp */}
        <p style={{ 
          fontSize: '9px', 
          color: '#9ca3af', 
          textAlign: 'center', 
          marginTop: '24px',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9'
        }}>
          Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
    );
  }
);

PurchaseOrderPrint.displayName = "PurchaseOrderPrint";
