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
              margin: 10mm 15mm;
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
      
      <div className="bg-white text-black" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.3' }}>
        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
          <tbody>
            <tr>
              <td style={{ width: '70px', verticalAlign: 'top' }}>
                {company.logo_url ? (
                  <img src={company.logo_url} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '60px', height: '60px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999' }}>LOGO</div>
                )}
              </td>
              <td style={{ verticalAlign: 'top', paddingLeft: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>{company.name}</div>
                <div>CNPJ: {company.cnpj}</div>
                <div>{company.address}</div>
                <div>Tel: {company.phone}{company.email ? ` | E-mail: ${company.email}` : ''}</div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', width: '150px' }}>
                <div style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', marginBottom: '4px' }}>TERMO Nº</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{termo.numero}</div>
                  <div style={{ fontSize: '9px', marginTop: '4px' }}>{formatDate(termo.data_emissao)}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '15px', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '8px 0' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>TERMO DE RESPONSABILIDADE</div>
          <div style={{ fontSize: '11px' }}>RECEBIMENTO DE EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL - EPI</div>
        </div>

        {/* Employee Info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <td colSpan={4} style={{ fontWeight: 'bold', padding: '5px 8px', borderBottom: '1px solid #000', fontSize: '10px' }}>IDENTIFICAÇÃO DO COLABORADOR</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #000', width: '15%', fontWeight: 'bold' }}>Nome:</td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #000', width: '35%' }}>{termo.employees?.name}</td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #000', width: '15%', fontWeight: 'bold' }}>Matrícula:</td>
              <td style={{ padding: '5px 8px', width: '35%' }}>{termo.employees?.registration_number || '-'}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #000' }}>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Cargo:</td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #000' }}>{termo.employees?.position || '-'}</td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #000', fontWeight: 'bold' }}>Setor:</td>
              <td style={{ padding: '5px 8px' }}>{termo.employees?.department || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* EPIs Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', border: '1px solid #000' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'left', fontSize: '10px', width: '30%' }}>DESCRIÇÃO DO EPI</th>
              <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontSize: '10px', width: '12%' }}>Nº C.A.</th>
              <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontSize: '10px', width: '8%' }}>TAM.</th>
              <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontSize: '10px', width: '6%' }}>QTD</th>
              <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontSize: '10px', width: '14%' }}>ENTREGA</th>
              <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontSize: '10px', width: '14%' }}>DEVOLUÇÃO</th>
              <th style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontSize: '10px', width: '16%' }}>ASS. RECEB.</th>
            </tr>
          </thead>
          <tbody>
            {termo.termo_epis?.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ border: '1px solid #000', padding: '5px 4px' }}>{item.epis?.name || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>{item.ca_number || item.epis?.ca_number || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>{item.tamanho || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>{item.quantidade}</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>{formatDate(item.data_entrega)}</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>{item.data_devolucao ? formatDate(item.data_devolucao) : '____/____/______'}</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}></td>
              </tr>
            ))}
            {/* Empty rows for manual additions - adjust count based on existing items */}
            {[...Array(Math.max(3, 8 - (termo.termo_epis?.length || 0)))].map((_, index) => (
              <tr key={`empty-${index}`}>
                <td style={{ border: '1px solid #000', padding: '5px 4px', height: '22px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>____/____/______</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>____/____/______</td>
                <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Terms */}
        <div style={{ border: '1px solid #000', padding: '10px', marginBottom: '15px', fontSize: '10px', textAlign: 'justify' }}>
          <p style={{ marginBottom: '8px' }}>
            Declaro ter recebido gratuitamente os Equipamentos de Proteção Individual - EPIs acima relacionados, em perfeito estado de conservação e funcionamento, 
            comprometendo-me a:
          </p>
          <p style={{ marginBottom: '4px', paddingLeft: '10px' }}>
            <strong>1.</strong> Usar o EPI apenas para a finalidade a que se destina, durante toda a jornada de trabalho;
          </p>
          <p style={{ marginBottom: '4px', paddingLeft: '10px' }}>
            <strong>2.</strong> Responsabilizar-me pela guarda e conservação do EPI;
          </p>
          <p style={{ marginBottom: '4px', paddingLeft: '10px' }}>
            <strong>3.</strong> Comunicar ao empregador qualquer alteração que o torne impróprio para uso;
          </p>
          <p style={{ marginBottom: '4px', paddingLeft: '10px' }}>
            <strong>4.</strong> Cumprir as determinações do empregador sobre o uso adequado;
          </p>
          <p style={{ marginBottom: '8px', paddingLeft: '10px' }}>
            <strong>5.</strong> Devolver o EPI ao empregador quando solicitado ou em caso de rescisão do contrato de trabalho.
          </p>
          <p style={{ fontWeight: 'bold' }}>
            Estou ciente de que o não uso do EPI constitui ato faltoso, podendo acarretar sanções disciplinares conforme NR-06 e Art. 158 da CLT.
          </p>
        </div>

        {/* Observations */}
        {termo.observacoes && (
          <div style={{ marginBottom: '15px', fontSize: '10px' }}>
            <strong>Observações:</strong> {termo.observacoes}
          </div>
        )}

        {/* Date and Signatures */}
        <div style={{ marginTop: '20px' }}>
          <p style={{ textAlign: 'center', marginBottom: '30px', fontSize: '10px' }}>
            Local e data: ______________________________________________, {formatDateExtended(termo.data_emissao)}
          </p>
          
          <table style={{ width: '100%', marginTop: '30px' }}>
            <tbody>
              <tr>
                <td style={{ width: '45%', textAlign: 'center', paddingTop: '30px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '5px', margin: '0 20px' }}>
                    <div style={{ fontWeight: 'bold' }}>{termo.employees?.name}</div>
                    <div style={{ fontSize: '9px' }}>Matrícula: {termo.employees?.registration_number || '-'}</div>
                    <div style={{ fontSize: '9px', marginTop: '2px' }}>COLABORADOR</div>
                  </div>
                </td>
                <td style={{ width: '10%' }}></td>
                <td style={{ width: '45%', textAlign: 'center', paddingTop: '30px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '5px', margin: '0 20px' }}>
                    <div style={{ fontWeight: 'bold' }}>{termo.responsavel_nome || 'Responsável'}</div>
                    <div style={{ fontSize: '9px' }}>Almoxarifado / Segurança do Trabalho</div>
                    <div style={{ fontSize: '9px', marginTop: '2px' }}>RESPONSÁVEL PELA ENTREGA</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ccc', fontSize: '8px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
          <span>Documento gerado eletronicamente em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          <span>Ref: {termo.numero}</span>
        </div>
      </div>
    </div>
  );
}
