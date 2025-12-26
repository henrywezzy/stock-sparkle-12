/**
 * Formata um valor numérico para o formato de moeda brasileira
 * @param value - Valor numérico a ser formatado
 * @returns String formatada no padrão R$ 1.000,99
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata um valor numérico para exibição sem símbolo da moeda
 * @param value - Valor numérico a ser formatado
 * @returns String formatada no padrão 1.000,99
 */
export const formatCurrencyValue = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Converte uma string de moeda brasileira para número
 * @param value - String no formato "1.000,99" ou "R$ 1.000,99"
 * @returns Valor numérico
 */
export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove R$, espaços e pontos (separadores de milhar)
  const cleanValue = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Aplica máscara de moeda enquanto o usuário digita
 * @param value - String digitada pelo usuário
 * @returns String formatada com máscara de moeda
 */
export const maskCurrency = (value: string): string => {
  // Remove tudo que não é número
  let onlyNumbers = value.replace(/\D/g, '');
  
  if (!onlyNumbers) return '';
  
  // Converte para número e divide por 100 para considerar centavos
  const numericValue = parseInt(onlyNumbers, 10) / 100;
  
  // Formata como moeda
  return formatCurrencyValue(numericValue);
};

/**
 * Extrai o valor numérico de uma string com máscara de moeda
 * @param maskedValue - String com máscara (ex: "1.234,56")
 * @returns Valor numérico (ex: 1234.56)
 */
export const unmaskCurrency = (maskedValue: string): number => {
  if (!maskedValue) return 0;
  
  // Remove pontos (separadores de milhar) e troca vírgula por ponto
  const normalized = maskedValue
    .replace(/\./g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};
