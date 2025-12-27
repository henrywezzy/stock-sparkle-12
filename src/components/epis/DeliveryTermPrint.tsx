import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TermoEntrega } from "@/hooks/useTermosEntrega";
import { CompanySettings } from "@/hooks/useCompanySettings";

interface DeliveryTermPrintProps {
  termo: TermoEntrega;
  companySettings?: CompanySettings | null;
}

export function DeliveryTermPrint({ termo, companySettings }: DeliveryTermPrintProps) {
  const company = {
    name: companySettings?.name || "Empresa XYZ Ltda",
    cnpj: companySettings?.cnpj || "00.000.000/0001-00",
    address: companySettings?.address 
      ? `${companySettings.address}${companySettings.city ? ` - ${companySettings.city}` : ''}${companySettings.state ? `/${companySettings.state}` : ''}`
      : "Rua Exemplo, 123 - Centro - Cidade/UF",
    phone: companySettings?.phone || "(00) 0000-0000",
    email: companySettings?.email || "",
    logo_url: companySettings?.logo_url,
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatDateExtended = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="print-container">
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      
      <div className="bg-white text-black" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', lineHeight: '1.2' }}>
        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ width: '60px', verticalAlign: 'top' }}>
                {company.logo_url ? (
                  <img src={company.logo_url} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '50px', height: '50px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#999' }}>LOGO</div>
                )}
              </td>
              <td style={{ verticalAlign: 'top', paddingLeft: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>{company.name}</div>
                <div style={{ fontSize: '9px' }}>CNPJ: {company.cnpj}</div>
                <div style={{ fontSize: '9px' }}>{company.address}</div>
                <div style={{ fontSize: '9px' }}>Tel: {company.phone}{company.email ? ` | ${company.email}` : ''}</div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', width: '120px' }}>
                <div style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', marginBottom: '2px' }}>TERMO Nº</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{termo.numero}</div>
                  <div style={{ fontSize: '8px', marginTop: '2px' }}>{formatDate(termo.data_emissao)}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '10px', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TERMO DE RESPONSABILIDADE</div>
          <div style={{ fontSize: '10px' }}>RECEBIMENTO DE EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL - EPI E UNIFORME</div>
        </div>

        {/* Employee Info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <td colSpan={4} style={{ fontWeight: 'bold', padding: '4px 6px', borderBottom: '1px solid #000', fontSize: '9px' }}>IDENTIFICAÇÃO DO COLABORADOR</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', width: '12%', fontWeight: 'bold', fontSize: '9px' }}>Nome:</td>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', width: '38%', fontSize: '9px' }}>{termo.employees?.name}</td>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', width: '12%', fontWeight: 'bold', fontSize: '9px' }}>Matrícula:</td>
              <td style={{ padding: '4px 6px', width: '38%', fontSize: '9px' }}>{termo.employees?.registration_number || '-'}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #000' }}>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '9px' }}>Cargo:</td>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontSize: '9px' }}>{termo.employees?.position || '-'}</td>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '9px' }}>Setor:</td>
              <td style={{ padding: '4px 6px', fontSize: '9px' }}>{termo.employees?.department || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* EPIs Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', border: '1px solid #000' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'left', fontSize: '9px', width: '32%' }}>DESCRIÇÃO DO EPI/UNIFORME</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '10%' }}>Nº C.A.</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '7%' }}>TAM.</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '5%' }}>QTD</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '12%' }}>ENTREGA</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '12%' }}>DEVOLUÇÃO</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '22%' }}>ASS. RECEB.</th>
            </tr>
          </thead>
          <tbody>
            {termo.termo_epis?.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ border: '1px solid #000', padding: '3px', fontSize: '9px' }}>{item.epis?.name || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>{item.ca_number || item.epis?.ca_number || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>{item.tamanho || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>{item.quantidade}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>{formatDate(item.data_entrega)}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>{item.data_devolucao ? formatDate(item.data_devolucao) : '___/___/____'}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}></td>
              </tr>
            ))}
            {/* Empty rows for manual additions */}
            {[...Array(Math.max(2, 6 - (termo.termo_epis?.length || 0)))].map((_, index) => (
              <tr key={`empty-${index}`}>
                <td style={{ border: '1px solid #000', padding: '3px', height: '18px', fontSize: '9px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>___/___/____</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>___/___/____</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '9px' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Terms */}
        <div style={{ border: '1px solid #000', padding: '8px', marginBottom: '10px', fontSize: '9px', textAlign: 'justify' }}>
          <p style={{ marginBottom: '6px' }}>
            Declaro ter recebido gratuitamente os Equipamentos de Proteção Individual - EPIs e Uniformes acima relacionados, em perfeito estado de conservação e funcionamento, comprometendo-me a:
          </p>
          <p style={{ marginBottom: '3px', paddingLeft: '8px' }}>
            <strong>1.</strong> Usar o EPI apenas para a finalidade a que se destina, durante toda a jornada de trabalho;
          </p>
          <p style={{ marginBottom: '3px', paddingLeft: '8px' }}>
            <strong>2.</strong> Responsabilizar-me pela guarda e conservação do EPI;
          </p>
          <p style={{ marginBottom: '3px', paddingLeft: '8px' }}>
            <strong>3.</strong> Comunicar ao empregador qualquer alteração que o torne impróprio para uso;
          </p>
          <p style={{ marginBottom: '3px', paddingLeft: '8px' }}>
            <strong>4.</strong> Cumprir as determinações do empregador sobre o uso adequado;
          </p>
          <p style={{ marginBottom: '6px', paddingLeft: '8px' }}>
            <strong>5.</strong> Devolver o EPI ao empregador quando solicitado ou em caso de rescisão do contrato de trabalho.
          </p>
          <p style={{ fontWeight: 'bold' }}>
            Estou ciente de que o não uso do EPI constitui ato faltoso, podendo acarretar sanções disciplinares conforme NR-06 e Art. 158 da CLT.
          </p>
        </div>

        {/* Observations */}
        {termo.observacoes && (
          <div style={{ marginBottom: '10px', fontSize: '9px' }}>
            <strong>Observações:</strong> {termo.observacoes}
          </div>
        )}

        {/* Date and Signatures */}
        <div style={{ marginTop: '15px' }}>
          <p style={{ textAlign: 'center', marginBottom: '25px', fontSize: '9px' }}>
            Local e data: ______________________________________________, {formatDateExtended(termo.data_emissao)}
          </p>
          
          <table style={{ width: '100%', marginTop: '25px' }}>
            <tbody>
              <tr>
                <td style={{ width: '45%', textAlign: 'center', paddingTop: '25px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '4px', margin: '0 15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{termo.employees?.name}</div>
                    <div style={{ fontSize: '8px' }}>Matrícula: {termo.employees?.registration_number || '-'}</div>
                    <div style={{ fontSize: '8px', marginTop: '2px' }}>COLABORADOR</div>
                  </div>
                </td>
                <td style={{ width: '10%' }}></td>
                <td style={{ width: '45%', textAlign: 'center', paddingTop: '25px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '4px', margin: '0 15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{termo.responsavel_nome || 'Responsável'}</div>
                    <div style={{ fontSize: '8px', marginTop: '2px' }}>RESPONSÁVEL PELA ENTREGA</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '15px', paddingTop: '8px', borderTop: '1px solid #ccc', fontSize: '7px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
          <span>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          <span>Ref: {termo.numero}</span>
        </div>
      </div>
    </div>
  );
}