/**
 * Funções de formatação e máscaras para campos de formulário
 */

// Remove todos os caracteres não numéricos
export const onlyNumbers = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Máscara de telefone: (00) 00000-0000 ou (00) 0000-0000
export const maskPhone = (value: string): string => {
  const numbers = onlyNumbers(value);
  
  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : '';
  }
  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  // Celular com 9 dígitos
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

// Máscara de CNPJ: 00.000.000/0000-00
export const maskCNPJ = (value: string): string => {
  const numbers = onlyNumbers(value);
  
  if (numbers.length <= 2) {
    return numbers;
  }
  if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  }
  if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  }
  if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  }
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
};

// Máscara de CPF: 000.000.000-00
export const maskCPF = (value: string): string => {
  const numbers = onlyNumbers(value);
  
  if (numbers.length <= 3) {
    return numbers;
  }
  if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  }
  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  }
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

// Máscara de CEP: 00000-000
export const maskCEP = (value: string): string => {
  const numbers = onlyNumbers(value);
  
  if (numbers.length <= 5) {
    return numbers;
  }
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

// Máscara de RG (formato genérico): 00.000.000-0
export const maskRG = (value: string): string => {
  const alphanumeric = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  if (alphanumeric.length <= 2) {
    return alphanumeric;
  }
  if (alphanumeric.length <= 5) {
    return `${alphanumeric.slice(0, 2)}.${alphanumeric.slice(2)}`;
  }
  if (alphanumeric.length <= 8) {
    return `${alphanumeric.slice(0, 2)}.${alphanumeric.slice(2, 5)}.${alphanumeric.slice(5)}`;
  }
  return `${alphanumeric.slice(0, 2)}.${alphanumeric.slice(2, 5)}.${alphanumeric.slice(5, 8)}-${alphanumeric.slice(8, 9)}`;
};

// Remove máscara e retorna apenas números
export const unmask = (value: string): string => {
  return onlyNumbers(value);
};

// Valida CNPJ
export const isValidCNPJ = (cnpj: string): boolean => {
  const numbers = onlyNumbers(cnpj);
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weight[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(numbers[12]) !== digit) return false;
  
  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weight[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(numbers[13]) === digit;
};

// Valida CPF
export const isValidCPF = (cpf: string): boolean => {
  const numbers = onlyNumbers(cpf);
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (parseInt(numbers[9]) !== digit) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return parseInt(numbers[10]) === digit;
};

// Máscara de data: DD/MM/AAAA
export const maskDate = (value: string): string => {
  const numbers = onlyNumbers(value);
  
  if (numbers.length <= 2) {
    return numbers;
  }
  if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
};

// Converte DD/MM/AAAA para AAAA-MM-DD (formato ISO)
export const dateToISO = (maskedDate: string): string => {
  const numbers = onlyNumbers(maskedDate);
  if (numbers.length !== 8) return '';
  
  const day = numbers.slice(0, 2);
  const month = numbers.slice(2, 4);
  const year = numbers.slice(4, 8);
  
  return `${year}-${month}-${day}`;
};

// Converte AAAA-MM-DD para DD/MM/AAAA
export const isoToDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

// Valida data DD/MM/AAAA
export const isValidDate = (date: string): boolean => {
  const numbers = onlyNumbers(date);
  if (numbers.length !== 8) return false;
  
  const day = parseInt(numbers.slice(0, 2), 10);
  const month = parseInt(numbers.slice(2, 4), 10);
  const year = parseInt(numbers.slice(4, 8), 10);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Validação mais precisa para dias do mês
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;
  
  return true;
};

// Tipo de máscara disponível
export type MaskType = 'phone' | 'cnpj' | 'cpf' | 'cep' | 'rg' | 'date';

// Aplica a máscara baseado no tipo
export const applyMask = (value: string, type: MaskType): string => {
  switch (type) {
    case 'phone':
      return maskPhone(value);
    case 'cnpj':
      return maskCNPJ(value);
    case 'cpf':
      return maskCPF(value);
    case 'cep':
      return maskCEP(value);
    case 'rg':
      return maskRG(value);
    case 'date':
      return maskDate(value);
    default:
      return value;
  }
};

// Interface para resposta do ViaCEP
export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// Busca endereço pelo CEP usando a API ViaCEP
export const fetchAddressByCEP = async (cep: string): Promise<ViaCEPResponse | null> => {
  const numbers = onlyNumbers(cep);
  if (numbers.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
    if (!response.ok) return null;
    
    const data: ViaCEPResponse = await response.json();
    if (data.erro) return null;
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};
