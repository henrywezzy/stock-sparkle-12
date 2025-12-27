import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TermoEntrega } from "@/hooks/useTermosEntrega";

interface DeliveryTermPrintProps {
  termo: TermoEntrega;
  companyInfo?: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
  };
}

export function DeliveryTermPrint({ termo, companyInfo }: DeliveryTermPrintProps) {
  const defaultCompany = {
    name: "Empresa XYZ Ltda",
    cnpj: "00.000.000/0001-00",
    address: "Rua Exemplo, 123 - Centro - Cidade/UF",
    phone: "(00) 0000-0000",
  };

  const company = companyInfo || defaultCompany;

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatDateExtended = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const TermContent = ({ via }: { via: string }) => (
    <div className="bg-white text-black p-8 mb-4 print:mb-0 print:p-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">{company.name}</h1>
            <p className="text-sm">CNPJ: {company.cnpj}</p>
            <p className="text-sm">{company.address}</p>
            <p className="text-sm">Tel: {company.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-sm">Data: {formatDate(termo.data_emissao)}</p>
            <p className="text-sm font-bold">Nº {termo.numero}</p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold uppercase">Termo de Responsabilidade e Recebimento</h2>
        <p className="text-sm">Equipamentos de Proteção Individual (EPIs)</p>
      </div>

      {/* Employee Info */}
      <div className="border border-black p-4 mb-6">
        <h3 className="font-bold mb-2 text-sm uppercase bg-gray-200 -mx-4 -mt-4 px-4 py-2">Dados do Colaborador</h3>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          <p><strong>Nome:</strong> {termo.employees?.name}</p>
          <p><strong>Matrícula:</strong> {termo.employees?.registration_number || '-'}</p>
          <p><strong>Cargo:</strong> {termo.employees?.position || '-'}</p>
          <p><strong>Setor:</strong> {termo.employees?.department || '-'}</p>
        </div>
      </div>

      {/* EPIs Table */}
      <div className="mb-6">
        <h3 className="font-bold mb-2 text-sm uppercase">EPIs Entregues</h3>
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black px-2 py-1 text-left">Item</th>
              <th className="border border-black px-2 py-1 text-center">CA</th>
              <th className="border border-black px-2 py-1 text-center">Tam.</th>
              <th className="border border-black px-2 py-1 text-center">Qtd</th>
              <th className="border border-black px-2 py-1 text-center">Entrega</th>
              <th className="border border-black px-2 py-1 text-center">Devolução</th>
              <th className="border border-black px-2 py-1 text-center">Validade</th>
            </tr>
          </thead>
          <tbody>
            {termo.termo_epis?.map((item, index) => (
              <tr key={item.id || index}>
                <td className="border border-black px-2 py-1">{item.epis?.name || '-'}</td>
                <td className="border border-black px-2 py-1 text-center">{item.ca_number || item.epis?.ca_number || '-'}</td>
                <td className="border border-black px-2 py-1 text-center">{item.tamanho || '-'}</td>
                <td className="border border-black px-2 py-1 text-center">{item.quantidade}</td>
                <td className="border border-black px-2 py-1 text-center">{formatDate(item.data_entrega)}</td>
                <td className="border border-black px-2 py-1 text-center">{item.data_devolucao ? formatDate(item.data_devolucao) : '___/___/______'}</td>
                <td className="border border-black px-2 py-1 text-center">{item.data_validade ? formatDate(item.data_validade) : '-'}</td>
              </tr>
            ))}
            {/* Empty rows for manual additions */}
            {[...Array(5)].map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="border border-black px-2 py-1 h-8">&nbsp;</td>
                <td className="border border-black px-2 py-1 text-center">&nbsp;</td>
                <td className="border border-black px-2 py-1 text-center">&nbsp;</td>
                <td className="border border-black px-2 py-1 text-center">&nbsp;</td>
                <td className="border border-black px-2 py-1 text-center">___/___/______</td>
                <td className="border border-black px-2 py-1 text-center">___/___/______</td>
                <td className="border border-black px-2 py-1 text-center">___/___/______</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Terms */}
      <div className="mb-6 text-xs border border-black p-3">
        <p className="mb-2">
          Declaro que recebi os Equipamentos de Proteção Individual (EPIs) discriminados acima, 
          em perfeito estado de conservação e adequados às minhas medidas.
        </p>
        <p className="font-bold mb-1">COMPROMETO-ME A:</p>
        <ul className="list-disc list-inside mb-2 space-y-0.5">
          <li>Utilizar os EPIs durante todo o período de trabalho</li>
          <li>Guardar e conservar em local adequado</li>
          <li>Comunicar qualquer alteração que os torne impróprios</li>
          <li>Responsabilizar-me pela guarda e conservação</li>
          <li>Devolver em caso de desligamento</li>
          <li>Ressarcir em caso de dano ou perda por negligência</li>
        </ul>
        <p className="font-bold">
          ESTOU CIENTE DE QUE: O não uso dos EPIs constitui ato faltoso, 
          sujeitando-me às penalidades previstas na NR-06 e CLT Art. 158.
        </p>
      </div>

      {/* Observations */}
      {termo.observacoes && (
        <div className="mb-6 text-sm">
          <p><strong>Observações:</strong> {termo.observacoes}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-8">
        <p className="text-center text-sm mb-8">
          {formatDateExtended(termo.data_emissao)}
        </p>
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-black pt-2 mx-4">
              <p className="font-bold text-sm">{termo.employees?.name}</p>
              <p className="text-xs">Matrícula: {termo.employees?.registration_number || '-'}</p>
              <p className="text-xs uppercase mt-1">Assinatura do Colaborador</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-2 mx-4">
              <p className="font-bold text-sm">{termo.responsavel_nome || 'Responsável'}</p>
              <p className="text-xs">Almoxarifado</p>
              <p className="text-xs uppercase mt-1">Assinatura do Responsável</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-400 text-xs text-gray-600 flex justify-between">
        <span>{via}</span>
        <span>Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
      </div>
    </div>
  );

  return (
    <div className="print-container">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0.5cm;
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
            .page-break {
              page-break-before: always;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      
      {/* Via do Colaborador */}
      <TermContent via="VIA DO COLABORADOR" />
      
      {/* Page break for second copy */}
      <div className="page-break" />
      
      {/* Via da Empresa */}
      <TermContent via="VIA DA EMPRESA - ARQUIVO" />
    </div>
  );
}
