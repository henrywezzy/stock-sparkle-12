import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Type definitions inline to avoid circular imports
interface TermoEmployee {
  name: string;
  department: string | null;
  position: string | null;
  registration_number: string | null;
  email: string | null;
  phone: string | null;
}

interface TermoEPIItem {
  id: string;
  termo_id: string;
  epi_id: string;
  ca_number: string | null;
  tamanho: string | null;
  quantidade: number;
  data_entrega: string;
  data_validade: string | null;
  data_devolucao: string | null;
  created_at: string;
  epis?: { name: string; ca_number: string | null } | null;
}

interface TermoData {
  id: string;
  numero: string;
  employee_id: string;
  data_emissao: string;
  responsavel_nome: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string;
  employees?: TermoEmployee | null;
  termo_epis?: TermoEPIItem[];
}

interface CompanyData {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface DeliveryTermPrintProps {
  termo: TermoData;
  companySettings?: CompanyData | null;
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

  // Calculate empty rows needed - always have at least 4 empty rows for manual additions
  const epiCount = termo.termo_epis?.length || 0;
  const emptyRowsCount = Math.max(4, 8 - epiCount);

  return (
    <div className="print-container">
      <div className="bg-white text-black" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', lineHeight: '1.3', padding: '8px' }}>
        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
          <tbody>
            <tr>
              <td style={{ width: '60px', verticalAlign: 'top' }}>
                {company.logo_url ? (
                  <img src={company.logo_url} alt="Logo" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '55px', height: '55px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999' }}>LOGO</div>
                )}
              </td>
              <td style={{ verticalAlign: 'top', paddingLeft: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '3px' }}>{company.name}</div>
                <div style={{ fontSize: '9px' }}>CNPJ: {company.cnpj}</div>
                <div style={{ fontSize: '9px' }}>{company.address}</div>
                <div style={{ fontSize: '9px' }}>Tel: {company.phone}{company.email ? ` | ${company.email}` : ''}</div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', width: '110px' }}>
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
        <div style={{ textAlign: 'center', marginBottom: '12px', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TERMO DE RESPONSABILIDADE E RECEBIMENTO</div>
          <div style={{ fontSize: '10px' }}>EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL - EPI E UNIFORME</div>
          <div style={{ fontSize: '8px', color: '#555', marginTop: '3px' }}>Conforme NR-06 (Portaria SEPRT nº 915/2019) e Art. 158 da CLT</div>
        </div>

        {/* Employee Info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ backgroundColor: '#e8e8e8' }}>
              <td colSpan={4} style={{ fontWeight: 'bold', padding: '4px 6px', borderBottom: '1px solid #000', fontSize: '9px' }}>IDENTIFICAÇÃO DO COLABORADOR</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', width: '10%', fontWeight: 'bold', fontSize: '9px' }}>Nome:</td>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', width: '40%', fontSize: '9px' }}>{termo.employees?.name}</td>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', width: '10%', fontWeight: 'bold', fontSize: '9px' }}>Matrícula:</td>
              <td style={{ padding: '4px 6px', width: '40%', fontSize: '9px' }}>{termo.employees?.registration_number || '-'}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #000' }}>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '9px' }}>Cargo:</td>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontSize: '9px' }}>{termo.employees?.position || '-'}</td>
              <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '9px' }}>Setor:</td>
              <td style={{ padding: '4px 6px', fontSize: '9px' }}>{termo.employees?.department || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <div style={{ border: '1px solid #000', padding: '8px', marginBottom: '12px', fontSize: '9px', textAlign: 'justify', backgroundColor: '#fafafa' }}>
          <p style={{ marginBottom: '0', margin: 0 }}>
            Declaro, para todos os fins legais, ter recebido <strong>gratuitamente</strong> da empresa acima identificada, em <strong>perfeito estado de conservação e funcionamento</strong>, os Equipamentos de Proteção Individual (EPI) e Uniformes abaixo discriminados, os quais são adequados aos riscos das atividades desenvolvidas em minha função.
          </p>
        </div>

        {/* EPIs Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', border: '1px solid #000' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8e8e8' }}>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'left', fontSize: '9px', width: '28%' }}>DESCRIÇÃO DO EPI/UNIFORME</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '10%' }}>Nº C.A.</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '7%' }}>TAM.</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '6%' }}>QTD</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '11%' }}>ENTREGA</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '11%' }}>VALIDADE</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '11%' }}>DEVOLUÇÃO</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'center', fontSize: '9px', width: '16%' }}>ASS. RECEBIMENTO</th>
            </tr>
          </thead>
          <tbody>
            {termo.termo_epis?.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px' }}>{item.epis?.name || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>{item.ca_number || item.epis?.ca_number || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>{item.tamanho || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>{item.quantidade}</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>{formatDate(item.data_entrega)}</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>{item.data_validade ? formatDate(item.data_validade) : '___/___/____'}</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>{item.data_devolucao ? formatDate(item.data_devolucao) : '___/___/____'}</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}></td>
              </tr>
            ))}
            {/* Empty rows for manual additions */}
            {[...Array(emptyRowsCount)].map((_, index) => (
              <tr key={`empty-${index}`}>
                <td style={{ border: '1px solid #000', padding: '3px 4px', height: '18px', fontSize: '9px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '8px' }}>___/___/____</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '8px' }}>___/___/____</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '8px' }}>___/___/____</td>
                <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: '9px' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Obligations Section - Compact */}
        <div className="obligations-section" style={{ border: '1px solid #000', marginBottom: '12px' }}>
          {/* Employee Obligations */}
          <div style={{ borderBottom: '1px solid #000', padding: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '9px', backgroundColor: '#e8e8e8', margin: '-6px -6px 5px -6px', padding: '4px 6px' }}>OBRIGAÇÕES DO COLABORADOR (NR-06, item 6.7)</div>
            <div style={{ fontSize: '8px', lineHeight: '1.4', columns: '2', columnGap: '15px' }}>
              <p style={{ marginBottom: '3px', paddingLeft: '0', margin: '0 0 3px 0' }}><strong>a)</strong> Utilizar o EPI apenas para a finalidade a que se destina;</p>
              <p style={{ marginBottom: '3px', paddingLeft: '0', margin: '0 0 3px 0' }}><strong>b)</strong> Responsabilizar-se pela guarda e conservação;</p>
              <p style={{ marginBottom: '3px', paddingLeft: '0', margin: '0 0 3px 0' }}><strong>c)</strong> Comunicar alteração que torne o EPI impróprio;</p>
              <p style={{ marginBottom: '3px', paddingLeft: '0', margin: '0 0 3px 0' }}><strong>d)</strong> Cumprir determinações do empregador;</p>
              <p style={{ marginBottom: '3px', paddingLeft: '0', margin: '0 0 3px 0' }}><strong>e)</strong> Devolver o EPI quando solicitado ou rescisão;</p>
              <p style={{ paddingLeft: '0', margin: 0 }}><strong>f)</strong> Submeter-se ao treinamento sobre uso correto.</p>
            </div>
          </div>

          {/* Policy and Consequences - Compact */}
          <div style={{ padding: '6px', backgroundColor: '#fff8e1' }}>
            <div style={{ fontWeight: 'bold', fontSize: '9px', backgroundColor: '#e8e8e8', margin: '-6px -6px 5px -6px', padding: '4px 6px' }}>POLÍTICA DE USO E CONSEQUÊNCIAS</div>
            <div style={{ fontSize: '8px', lineHeight: '1.4' }}>
              <p style={{ marginBottom: '3px', margin: '0 0 3px 0' }}>
                • A troca será realizada mediante apresentação do EPI danificado. EPIs danificados por negligência poderão ser descontados (Art. 462 CLT).
              </p>
              <p style={{ margin: 0 }}>
                • Conforme <strong>NR-06 e Art. 158 da CLT</strong>, a recusa injustificada em usar o EPI constitui <strong>ato faltoso</strong>, sujeito a advertência, suspensão e dispensa por justa causa.
              </p>
            </div>
          </div>
        </div>

        {/* Observations */}
        {termo.observacoes && (
          <div style={{ marginBottom: '12px', fontSize: '9px', border: '1px solid #000', padding: '5px' }}>
            <strong>Observações:</strong> {termo.observacoes}
          </div>
        )}

        {/* Final Declaration */}
        <div style={{ border: '1px solid #000', padding: '6px', marginBottom: '15px', fontSize: '8px', textAlign: 'justify', backgroundColor: '#f5f5f5' }}>
          <p style={{ margin: 0 }}>
            Declaro ter recebido treinamento sobre o uso correto, guarda e conservação dos EPIs acima relacionados, estando ciente de que o não cumprimento das normas de segurança constitui ato faltoso sujeito às penalidades previstas em lei.
          </p>
        </div>

        {/* Date and Signatures */}
        <div className="signature-section" style={{ marginTop: '15px' }}>
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
                    <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{termo.responsavel_nome || 'Responsável pela Entrega'}</div>
                    <div style={{ fontSize: '8px', marginTop: '2px' }}>RESPONSÁVEL / ALMOXARIFADO</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '15px', paddingTop: '8px', borderTop: '1px solid #ccc', fontSize: '7px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
          <span>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | Válido para auditorias e fiscalizações</span>
          <span>Ref: {termo.numero}</span>
        </div>
      </div>
    </div>
  );
}
