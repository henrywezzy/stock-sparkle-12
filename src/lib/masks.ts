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

// Tipo de máscara disponível
export type MaskType = 'phone' | 'cnpj' | 'cpf' | 'cep' | 'rg';

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
    default:
      return value;
  }
};
