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

  // Calculate empty rows needed - always have at least 5 empty rows for manual additions
  const epiCount = termo.termo_epis?.length || 0;
  const emptyRowsCount = Math.max(5, 10 - epiCount);

  return (
    <div className="print-container">
      <div className="bg-white text-black" style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', lineHeight: '1.15' }}>
        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
          <tbody>
            <tr>
              <td style={{ width: '55px', verticalAlign: 'top' }}>
                {company.logo_url ? (
                  <img src={company.logo_url} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '50px', height: '50px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#999' }}>LOGO</div>
                )}
              </td>
              <td style={{ verticalAlign: 'top', paddingLeft: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>{company.name}</div>
                <div style={{ fontSize: '8px' }}>CNPJ: {company.cnpj}</div>
                <div style={{ fontSize: '8px' }}>{company.address}</div>
                <div style={{ fontSize: '8px' }}>Tel: {company.phone}{company.email ? ` | ${company.email}` : ''}</div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', width: '100px' }}>
                <div style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', marginBottom: '1px' }}>TERMO Nº</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{termo.numero}</div>
                  <div style={{ fontSize: '7px', marginTop: '1px' }}>{formatDate(termo.data_emissao)}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '8px', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '5px 0' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TERMO DE RESPONSABILIDADE E RECEBIMENTO</div>
          <div style={{ fontSize: '9px' }}>EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL - EPI E UNIFORME</div>
          <div style={{ fontSize: '7px', color: '#555', marginTop: '2px' }}>Conforme NR-06 (Portaria SEPRT nº 915/2019) e Art. 158 da CLT</div>
        </div>

        {/* Employee Info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ backgroundColor: '#e8e8e8' }}>
              <td colSpan={4} style={{ fontWeight: 'bold', padding: '3px 5px', borderBottom: '1px solid #000', fontSize: '8px' }}>IDENTIFICAÇÃO DO COLABORADOR</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 5px', borderRight: '1px solid #000', width: '10%', fontWeight: 'bold', fontSize: '8px' }}>Nome:</td>
              <td style={{ padding: '3px 5px', borderRight: '1px solid #000', width: '40%', fontSize: '8px' }}>{termo.employees?.name}</td>
              <td style={{ padding: '3px 5px', borderRight: '1px solid #000', width: '10%', fontWeight: 'bold', fontSize: '8px' }}>Matrícula:</td>
              <td style={{ padding: '3px 5px', width: '40%', fontSize: '8px' }}>{termo.employees?.registration_number || '-'}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #000' }}>
              <td style={{ padding: '3px 5px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '8px' }}>Cargo:</td>
              <td style={{ padding: '3px 5px', borderRight: '1px solid #000', fontSize: '8px' }}>{termo.employees?.position || '-'}</td>
              <td style={{ padding: '3px 5px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '8px' }}>Setor:</td>
              <td style={{ padding: '3px 5px', fontSize: '8px' }}>{termo.employees?.department || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <div style={{ border: '1px solid #000', padding: '6px', marginBottom: '8px', fontSize: '8px', textAlign: 'justify', backgroundColor: '#fafafa' }}>
          <p style={{ marginBottom: '4px', margin: 0 }}>
            Declaro, para todos os fins legais, ter recebido <strong>gratuitamente</strong> da empresa acima identificada, em <strong>perfeito estado de conservação e funcionamento</strong>, os Equipamentos de Proteção Individual (EPI) e Uniformes abaixo discriminados, os quais são adequados aos riscos das atividades desenvolvidas em minha função na <strong>indústria metalmecânica</strong>.
          </p>
        </div>

        {/* EPIs Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid #000' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8e8e8' }}>
              <th style={{ border: '1px solid #000', padding: '3px 2px', textAlign: 'left', fontSize: '8px', width: '30%' }}>DESCRIÇÃO DO EPI/UNIFORME</th>
              <th style={{ border: '1px solid #000', padding: '3px 2px', textAlign: 'center', fontSize: '8px', width: '10%' }}>Nº C.A.</th>
              <th style={{ border: '1px solid #000', padding: '3px 2px', textAlign: 'center', fontSize: '8px', width: '6%' }}>TAM.</th>
              <th style={{ border: '1px solid #000', padding: '3px 2px', textAlign: 'center', fontSize: '8px', width: '5%' }}>QTD</th>
              <th style={{ border: '1px solid #000', padding: '3px 2px', textAlign: 'center', fontSize: '8px', width: '10%' }}>ENTREGA</th>
              <th style={{ border: '1px solid #000', padding: '3px 2px', textAlign: 'center', fontSize: '8px', width: '10%' }}>VALIDADE</th>
              <th style={{ border: '1px solid #000', padding: '3px 2px', textAlign: 'center', fontSize: '8px', width: '10%' }}>DEVOLUÇÃO</th>
              <th style={{ border: '1px solid #000', padding: '3px 2px', textAlign: 'center', fontSize: '8px', width: '19%' }}>ASS. RECEBIMENTO</th>
            </tr>
          </thead>
          <tbody>
            {termo.termo_epis?.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ border: '1px solid #000', padding: '2px 3px', fontSize: '8px' }}>{item.epis?.name || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>{item.ca_number || item.epis?.ca_number || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>{item.tamanho || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>{item.quantidade}</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>{formatDate(item.data_entrega)}</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>{item.data_validade ? formatDate(item.data_validade) : '___/___/____'}</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>{item.data_devolucao ? formatDate(item.data_devolucao) : '___/___/____'}</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}></td>
              </tr>
            ))}
            {/* Empty rows for manual additions */}
            {[...Array(emptyRowsCount)].map((_, index) => (
              <tr key={`empty-${index}`}>
                <td style={{ border: '1px solid #000', padding: '2px 3px', height: '16px', fontSize: '8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '7px' }}>___/___/____</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '7px' }}>___/___/____</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '7px' }}>___/___/____</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'center', fontSize: '8px' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Obligations Section */}
        <div className="obligations-section" style={{ border: '1px solid #000', marginBottom: '8px' }}>
          {/* Employee Obligations */}
          <div style={{ borderBottom: '1px solid #000', padding: '5px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', backgroundColor: '#e8e8e8', margin: '-5px -5px 4px -5px', padding: '3px 5px' }}>OBRIGAÇÕES DO COLABORADOR (NR-06, item 6.7)</div>
            <div style={{ fontSize: '7px', lineHeight: '1.3' }}>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}><strong>a)</strong> Utilizar o EPI apenas para a finalidade a que se destina, durante toda a jornada de trabalho;</p>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}><strong>b)</strong> Responsabilizar-se pela guarda e conservação do EPI que lhe foi confiado;</p>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}><strong>c)</strong> Comunicar imediatamente ao empregador qualquer alteração que torne o EPI impróprio para uso;</p>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}><strong>d)</strong> Cumprir as determinações do empregador sobre o uso adequado do EPI;</p>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}><strong>e)</strong> Devolver o EPI ao empregador quando solicitado ou em caso de rescisão do contrato de trabalho;</p>
              <p style={{ paddingLeft: '6px', margin: 0 }}><strong>f)</strong> Submeter-se ao treinamento sobre uso correto, guarda e conservação do EPI.</p>
            </div>
          </div>

          {/* Employer Obligations */}
          <div style={{ borderBottom: '1px solid #000', padding: '5px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', backgroundColor: '#e8e8e8', margin: '-5px -5px 4px -5px', padding: '3px 5px' }}>RESPONSABILIDADES DO EMPREGADOR (NR-06, item 6.6)</div>
            <div style={{ fontSize: '7px', lineHeight: '1.3' }}>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}><strong>a)</strong> Adquirir o EPI adequado ao risco de cada atividade;</p>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}><strong>b)</strong> Exigir seu uso e fornecer ao trabalhador somente EPI aprovado pelo órgão nacional competente;</p>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}><strong>c)</strong> Orientar e treinar o trabalhador sobre o uso adequado, guarda e conservação;</p>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}><strong>d)</strong> Substituir imediatamente quando danificado ou extraviado;</p>
              <p style={{ paddingLeft: '6px', margin: 0 }}><strong>e)</strong> Higienizar e realizar manutenção periódica, quando aplicável.</p>
            </div>
          </div>

          {/* Use, Conservation and Exchange Policy */}
          <div style={{ borderBottom: '1px solid #000', padding: '5px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', backgroundColor: '#e8e8e8', margin: '-5px -5px 4px -5px', padding: '3px 5px' }}>POLÍTICA DE USO, CONSERVAÇÃO, TROCA E DEVOLUÇÃO</div>
            <div style={{ fontSize: '7px', lineHeight: '1.3' }}>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}>• A troca será realizada mediante apresentação do EPI danificado ou desgastado pelo uso normal;</p>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}>• EPIs danificados por mau uso, negligência ou extravio poderão ser descontados conforme Art. 462 da CLT;</p>
              <p style={{ marginBottom: '2px', paddingLeft: '6px', margin: '0 0 2px 0' }}>• Uniformes são de uso exclusivo nas dependências da empresa e em serviço externo autorizado;</p>
              <p style={{ paddingLeft: '6px', margin: 0 }}>• A devolução é obrigatória na rescisão contratual, afastamento ou quando solicitado pela empresa.</p>
            </div>
          </div>

          {/* Consequences */}
          <div style={{ padding: '5px', backgroundColor: '#fff8e1' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', backgroundColor: '#e8e8e8', margin: '-5px -5px 4px -5px', padding: '3px 5px' }}>CONSEQUÊNCIAS DO NÃO USO OU USO INADEQUADO</div>
            <div style={{ fontSize: '7px', lineHeight: '1.3' }}>
              <p style={{ marginBottom: '2px', margin: '0 0 2px 0' }}>
                Conforme <strong>NR-06 (item 6.7.1)</strong> e <strong>Art. 158, parágrafo único, da CLT</strong>, constitui <strong>ato faltoso</strong> a recusa injustificada do empregado em usar o EPI fornecido pelo empregador.
              </p>
              <p style={{ margin: 0 }}>
                O descumprimento das obrigações aqui assumidas poderá acarretar as seguintes <strong>sanções disciplinares progressivas</strong>: advertência verbal, advertência escrita, suspensão e dispensa por justa causa, conforme a gravidade e reincidência.
              </p>
            </div>
          </div>
        </div>

        {/* Observations */}
        {termo.observacoes && (
          <div style={{ marginBottom: '8px', fontSize: '8px', border: '1px solid #000', padding: '4px' }}>
            <strong>Observações:</strong> {termo.observacoes}
          </div>
        )}

        {/* Final Declaration */}
        <div style={{ border: '1px solid #000', padding: '5px', marginBottom: '10px', fontSize: '7px', textAlign: 'justify', backgroundColor: '#f5f5f5' }}>
          <p style={{ margin: 0 }}>
            Declaro ter recebido treinamento sobre o uso correto, guarda e conservação dos EPIs acima relacionados, estando ciente de que o não cumprimento das normas de segurança constitui ato faltoso sujeito às penalidades previstas em lei. Este termo é válido para auditorias, fiscalizações trabalhistas e controle interno de estoque.
          </p>
        </div>

        {/* Date and Signatures */}
        <div className="signature-section" style={{ marginTop: '10px' }}>
          <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '8px' }}>
            Local e data: ______________________________________________, {formatDateExtended(termo.data_emissao)}
          </p>
          
          <table style={{ width: '100%', marginTop: '20px' }}>
            <tbody>
              <tr>
                <td style={{ width: '45%', textAlign: 'center', paddingTop: '20px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '3px', margin: '0 10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '8px' }}>{termo.employees?.name}</div>
                    <div style={{ fontSize: '7px' }}>Matrícula: {termo.employees?.registration_number || '-'}</div>
                    <div style={{ fontSize: '7px', marginTop: '1px' }}>COLABORADOR</div>
                  </div>
                </td>
                <td style={{ width: '10%' }}></td>
                <td style={{ width: '45%', textAlign: 'center', paddingTop: '20px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '3px', margin: '0 10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '8px' }}>{termo.responsavel_nome || 'Responsável pela Entrega'}</div>
                    <div style={{ fontSize: '7px', marginTop: '1px' }}>RESPONSÁVEL PELA ENTREGA / ALMOXARIFADO</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '12px', paddingTop: '6px', borderTop: '1px solid #ccc', fontSize: '6px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
          <span>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | Válido para auditorias e fiscalizações</span>
          <span>Ref: {termo.numero}</span>
        </div>
      </div>
    </div>
  );
}